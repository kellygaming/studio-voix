-- Studio Voix : schéma initial
-- Profils + offre, projets, coupes (non destructives), jobs de traitement, stockage audio.

-- ============ PROFILS ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'gratuit' check (plan in ('gratuit', 'standard', 'studio')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PROJETS ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Sans titre',
  template text not null default 'libre' check (template in ('podcast', 'cours', 'note', 'libre')),
  status text not null default 'recording' check (status in ('recording', 'uploaded', 'processing', 'ready', 'error')),
  duration_seconds real,
  raw_path text,      -- original, jamais modifié
  clean_path text,    -- après débruitage (WAV, source de l'export)
  preview_path text,  -- MP3 léger de l'audio propre, pour l'écoute dans l'éditeur
  peaks jsonb,        -- forme d'onde précalculée (tableau de 0..1)
  export_path text,   -- dernier MP3 exporté
  words jsonb,        -- [{text, start, end}] issu de la passe batch sur l'audio propre
  live_transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id, created_at desc);

-- ============ COUPES ============
-- Une ligne = un segment [start, end] retiré à l'export. Annuler = supprimer la ligne.
create table public.cuts (
  id text not null,
  project_id uuid not null references public.projects (id) on delete cascade,
  start_s real not null,
  end_s real not null check (end_s > start_s),
  kind text not null default 'manual' check (kind in ('manual', 'silence')),
  created_at timestamptz not null default now(),
  primary key (project_id, id)
);

-- ============ JOBS ============
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('process', 'export')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error')),
  progress real not null default 0,
  step text,
  error text,
  attempts int not null default 0,
  billed_seconds real not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_queue_idx on public.jobs (status, created_at) where status = 'queued';

-- Le worker (clé service_role) réclame un job de façon atomique.
create function public.claim_job() returns public.jobs
language plpgsql security definer set search_path = public as $$
declare j public.jobs;
begin
  select * into j from public.jobs
   where status = 'queued'
      or (status = 'running' and locked_at < now() - interval '30 minutes' and attempts < 3)
   order by created_at
   limit 1
   for update skip locked;
  if not found then return null; end if;
  update public.jobs
     set status = 'running', locked_at = now(), attempts = attempts + 1, updated_at = now()
   where id = j.id
   returning * into j;
  return j;
end;
$$;
revoke all on function public.claim_job() from public, anon, authenticated;

-- Minutes traitées ce mois-ci (garde-fou par offre).
create function public.minutes_used_this_month(uid uuid) returns real
language sql stable security definer set search_path = public as $$
  select coalesce(sum(billed_seconds), 0) / 60.0
    from public.jobs
   where user_id = uid and type = 'process' and status in ('running', 'done', 'queued')
     and created_at >= date_trunc('month', now());
$$;
revoke all on function public.minutes_used_this_month(uuid) from public, anon, authenticated;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.cuts enable row level security;
alter table public.jobs enable row level security;

create policy "profil: lecture perso" on public.profiles for select using (auth.uid() = id);
-- Pas d'update client : le plan est modifié côté serveur après paiement Mobile Money.

create policy "projets: lecture perso" on public.projects for select using (auth.uid() = user_id);
create policy "projets: création perso" on public.projects for insert with check (auth.uid() = user_id);
create policy "projets: maj perso" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projets: suppression perso" on public.projects for delete using (auth.uid() = user_id);

create policy "coupes: tout perso" on public.cuts for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "jobs: lecture perso" on public.jobs for select using (auth.uid() = user_id);
-- Aucune policy insert : les jobs se créent uniquement via enqueue_job() qui applique les plafonds.

-- Plafonds par offre (garder synchronisé avec lib/plans.ts et worker/src/plans.ts)
create function public.plan_limits(p text, out max_recording_s real, out monthly_minutes real)
language sql immutable as $$
  select case p when 'studio' then 3600 when 'standard' then 1800 else 180 end::real,
         case p when 'studio' then 300 when 'standard' then 120 else 3 end::real;
$$;

create function public.enqueue_job(p_project uuid, p_type text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  proj public.projects;
  prof public.profiles;
  lim record;
  active_plan text;
  new_id uuid;
begin
  if uid is null then raise exception 'non authentifié'; end if;
  if p_type not in ('process', 'export') then raise exception 'type invalide'; end if;

  select * into proj from public.projects where id = p_project and user_id = uid;
  if not found then raise exception 'projet introuvable'; end if;

  if exists (select 1 from public.jobs where project_id = p_project and type = p_type and status in ('queued', 'running')) then
    raise exception 'un traitement est déjà en cours';
  end if;

  select * into prof from public.profiles where id = uid;
  active_plan := case when prof.plan_expires_at is null or prof.plan_expires_at > now() then coalesce(prof.plan, 'gratuit') else 'gratuit' end;
  select * into lim from public.plan_limits(active_plan);

  if p_type = 'process' then
    if proj.raw_path is null then raise exception 'aucun enregistrement'; end if;
    if coalesce(proj.duration_seconds, 0) > lim.max_recording_s + 5 then
      raise exception 'durée maximale de votre offre dépassée';
    end if;
    if public.minutes_used_this_month(uid) + coalesce(proj.duration_seconds, 0) / 60.0 > lim.monthly_minutes then
      raise exception 'quota mensuel de votre offre atteint';
    end if;
    update public.projects set status = 'processing', updated_at = now() where id = p_project;
  else
    if proj.clean_path is null then raise exception 'audio pas encore traité'; end if;
  end if;

  insert into public.jobs (project_id, user_id, type, billed_seconds)
  values (p_project, uid, p_type, case when p_type = 'process' then coalesce(proj.duration_seconds, 0) else 0 end)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.enqueue_job(uuid, text) from public, anon;
grant execute on function public.enqueue_job(uuid, text) to authenticated;

-- Temps réel pour suivre la progression des jobs
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.projects;

-- ============ STOCKAGE ============
-- Chemins : {user_id}/{project_id}/raw.webm | clean.wav | export.mp3
insert into storage.buckets (id, name, public, file_size_limit)
values ('audio', 'audio', false, 524288000)
on conflict (id) do nothing;

create policy "audio: lecture perso" on storage.objects for select
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio: dépôt perso" on storage.objects for insert
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio: suppression perso" on storage.objects for delete
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
