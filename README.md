# Studio Voix

Une voix de studio sans micro pro, rien à installer : enregistrement dans le navigateur, débruitage, transcription en français, édition par texte, export MP3.

## Pipeline

```
Navigateur (MediaRecorder Opus 48 kHz, filtres désactivés)
   │  + transcription en direct (ElevenLabs Scribe v2 Realtime, affichage seulement)
   ▼
Supabase Storage  audio/{user}/{projet}/raw.*
   │  enqueue_job('process')  ← plafonds de l'offre vérifiés en SQL
   ▼
Worker (Railway / Render / Fly.io, FFmpeg)
   1. décodage WAV + mesure réelle de la durée (garde-fou)
   2. débruitage : Auphonic (Standard / Gratuit) ou ElevenLabs Voice Isolator (Voix Studio)
   3. transcription batch Scribe v2 sur l'audio propre (minutage par mot)
   4. aperçu MP3 + forme d'onde précalculée
   ▼
Éditeur (Next.js) : phrases barrées = lignes dans `cuts` (non destructif, annulable)
   │  enqueue_job('export')
   ▼
Worker : atrim + fondus 15 ms à chaque jonction + concat + loudnorm -16 LUFS → MP3
```

## Structure

| Dossier | Rôle |
|---|---|
| `app/` | Pages Next.js : accueil, `/connexion`, `/enregistrer`, `/projets`, `/projets/[id]` |
| `components/` | `Recorder`, `Editor`, `Waveform`, `ProjectView`, `Header` |
| `lib/cuts.ts` | Logique pure des coupes (silences, segments conservés, filtre FFmpeg). Tests : `npm test` |
| `lib/plans.ts` | Offres et plafonds (à garder synchronisés avec la migration SQL et `worker/src/plans.ts`) |
| `supabase/migrations/` | Tables, RLS, bucket `audio`, `claim_job()`, `enqueue_job()` |
| `worker/` | Service Node + FFmpeg (Dockerfile) |

## Mise en route

1. **Supabase** : créer un projet, puis exécuter `supabase/migrations/0001_init.sql` dans l'éditeur SQL.
   Dans *Authentication → URL Configuration*, ajouter `https://votre-domaine/auth/callback` aux Redirect URLs.
2. **Vercel** : importer ce dépôt, définir les variables de `.env.example`.
3. **Worker** : déployer le dossier `worker/` (Dockerfile) sur Railway / Render / Fly.io avec les variables de `worker/.env.example`.
4. **Clés API** : ElevenLabs (Scribe + Voice Isolator) et Auphonic.

Développement local :

```bash
npm install
cp .env.example .env.local   # puis remplir
npm run dev
```

## Offres (plafonds provisoires)

| Offre | Durée max / enregistrement | Minutes / mois | Débruitage |
|---|---|---|---|
| Gratuit | 3 min | 3 | Auphonic |
| Standard | 30 min | 120 | Auphonic |
| Voix Studio | 60 min | 300 | ElevenLabs Voice Isolator |

Le plan d'un utilisateur (`profiles.plan`, `plan_expires_at`) est modifié côté serveur après confirmation du paiement Mobile Money (à brancher).

## À faire

- Paiement Mobile Money (webhook → mise à jour de `profiles`).
- Optionnel : passe LLM pour retirer les « euh » et ponctuer.
- Héberger les visuels dans `public/images/` (actuellement servis depuis le CDN Higgsfield, voir `lib/images.ts`).
