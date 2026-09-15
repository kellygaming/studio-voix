-- Correctifs issus des advisors Supabase (appliqués le 2026-09-15 sur le projet trtuhnzvkhtrshjarbgq)

-- Sécurité : fonctions
alter function public.plan_limits(text) set search_path = public;
revoke all on function public.handle_new_user() from public, anon, authenticated;
-- enqueue_job reste appelable par "authenticated" : c'est voulu (seule porte d'entrée, applique les plafonds).

-- Performance : auth.uid() évalué une seule fois par requête
drop policy "profil: lecture perso" on public.profiles;
create policy "profil: lecture perso" on public.profiles for select using ((select auth.uid()) = id);

drop policy "projets: lecture perso" on public.projects;
drop policy "projets: création perso" on public.projects;
drop policy "projets: maj perso" on public.projects;
drop policy "projets: suppression perso" on public.projects;
create policy "projets: lecture perso" on public.projects for select using ((select auth.uid()) = user_id);
create policy "projets: création perso" on public.projects for insert with check ((select auth.uid()) = user_id);
create policy "projets: maj perso" on public.projects for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projets: suppression perso" on public.projects for delete using ((select auth.uid()) = user_id);

drop policy "coupes: tout perso" on public.cuts;
create policy "coupes: tout perso" on public.cuts for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

drop policy "jobs: lecture perso" on public.jobs;
create policy "jobs: lecture perso" on public.jobs for select using ((select auth.uid()) = user_id);

-- Performance : index sur les clés étrangères
create index if not exists jobs_project_idx on public.jobs (project_id, created_at desc);
create index if not exists jobs_user_idx on public.jobs (user_id, created_at);
