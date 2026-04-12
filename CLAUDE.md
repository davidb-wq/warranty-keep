# WarrantyKeep — Guide de développement

## État du projet (mis à jour le 2026-04-12)

### ✅ Complété — Application 100% opérationnelle
- Tout le code source écrit (39 fichiers, 1782 lignes)
- `npm install` fait — `node_modules/` présent
- Node.js installé et dans le PATH système
- Repo GitHub : **https://github.com/davidb-wq/warranty-keep**
- Déploiement Vercel : **https://warranty-keep.vercel.app**
- Supabase configuré : table `warranties`, RLS, Storage bucket `warranty-images`, Magic Link activé
- Variables d'environnement configurées sur Vercel (6 variables)
- URLs de redirection Supabase configurées pour Vercel
- Resend configuré — emails envoyés depuis `onboarding@resend.dev`
- Cron mensuel testé et fonctionnel (1er du mois à 9h UTC)
- Email de test envoyé avec succès à `davidblouin03@gmail.com`
- **Auth corrigée** — callback gère `code` (PKCE) et `token_hash` (confirmation signup)
- **Rate limit** — countdown 60s sur le bouton d'envoi, erreurs traduites en français
- **Templates email Supabase** personnalisés en français (Magic Link + Confirm signup)

### ⚠️ Limitation connue — Resend sans domaine custom
Resend en mode gratuit sans domaine vérifié ne peut envoyer **qu'à l'email du compte Resend** (`davidblouin03@gmail.com`).
Le compte WarrantyKeep utilise `davidblouin.5@hotmail.com` → les rappels automatiques n'arriveront pas à cette adresse.

**Solutions :**
- **Option A (rapide)** : Vérifier `davidblouin.5@hotmail.com` dans Resend → resend.com → Settings → Emails
- **Option B (complète)** : Ajouter un domaine custom sur Resend → envoie à tous les utilisateurs

### 🔧 Reste à faire (optionnel)
- **Ajouter les icônes PWA** — générer sur pwabuilder.com et placer dans `public/icons/`
- **Vérifier email Hotmail sur Resend** — pour recevoir les rappels sur le bon compte

---

## Décisions prises
- **Auth :** Magic Link uniquement (pas de mot de passe)
- **Email :** domaine gratuit Resend (`onboarding@resend.dev`)
- **Utilisateurs :** Multi-utilisateurs avec RLS Supabase
- **Nom :** WarrantyKeep

## Stack technologique
- **Framework :** Next.js (App Router, TypeScript) — version actuelle installée
- **Styles :** Tailwind CSS + Lucide-React
- **Auth & BDD :** Supabase (tier gratuit)
- **Stockage images :** Supabase Storage (1GB) — compression client-side avant upload
- **Hébergement :** Vercel (tier gratuit)
- **Emails :** Resend (3000 emails/mois gratuits)

## Structure des fichiers

```
warranty-keep/
├── .env.local                     # Jamais commité — À CRÉER
├── .env.example                   # Modèle avec les clés vides
├── .gitignore
├── next.config.ts                 # Header Service-Worker-Allowed
├── tailwind.config.ts             # darkMode: 'media', tokens sémantiques
├── tsconfig.json                  # target ES2017 ajouté automatiquement
├── vercel.json                    # Cron job : 0 9 1 * * (1er du mois, 9h UTC)
├── package.json
├── start-dev.bat                  # Script de lancement local (contournement PATH)
│
├── public/
│   ├── icons/                     # À CRÉER : icon-192, 512, maskable-192, maskable-512
│   ├── sw.js                      # Service worker (network-first, prod uniquement)
│   └── favicon.ico                # À AJOUTER
│
├── emails/
│   └── warranty-reminder.tsx      # Template React Email en français
│
├── supabase/
│   └── email-templates/
│       ├── magic-link.html        # Template Supabase — lien de connexion (FR)
│       └── confirm-signup.html    # Template Supabase — confirmation nouveau compte (FR)
│
└── src/
    ├── middleware.ts              # Refresh token Supabase + redirect si non-auth
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts          # createBrowserClient
    │   │   └── server.ts          # createServerClient (cookies)
    │   ├── image-compression.ts   # browser-image-compression → 0.5MB max, WebP
    │   └── warranty-utils.ts      # getExpiryDate, getWarrantyStatus, STATUS_STYLES
    ├── types/
    │   └── warranty.ts            # interface Warranty, WarrantyStatus
    └── app/
        ├── layout.tsx             # Root layout, metadata PWA, <SWRegister>
        ├── manifest.ts            # PWA manifest (display: standalone)
        ├── globals.css            # Tailwind + classe .input + pb-safe
        ├── page.tsx               # Redirect → /warranties
        ├── not-found.tsx
        ├── (auth)/
        │   ├── layout.tsx         # Layout centré (pas de bottom nav)
        │   ├── login/page.tsx     # Formulaire magic link + countdown 60s anti-rate-limit
        │   └── auth/callback/route.ts  # Gère code (PKCE) ET token_hash (confirm signup)
        ├── (app)/
        │   ├── layout.tsx         # Auth guard (getUser) + BottomNav
        │   ├── warranties/
        │   │   ├── page.tsx       # Liste triée : expirantes → actives → lifetime → expirées
        │   │   ├── loading.tsx    # Skeleton loader
        │   │   └── [id]/
        │   │       ├── page.tsx   # Détail complet + Server Action suppression
        │   │       └── edit/page.tsx
        │   ├── add/page.tsx
        │   └── settings/page.tsx  # Déconnexion + info rappels
        ├── api/
        │   └── cron/route.ts      # Job mensuel : scan + envoi Resend
        └── components/
            ├── ui/
            │   ├── bottom-nav.tsx      # 3 tabs, fixed bottom, safe-area-inset
            │   ├── warranty-card.tsx   # Carte avec bordure colorée + badge lieu
            │   └── expiry-badge.tsx    # Pill coloré selon statut
            ├── forms/
            │   ├── warranty-form.tsx   # Formulaire add/edit partagé
            │   └── image-upload.tsx    # Camera/file + compression + preview
            └── providers/
                └── sw-register.tsx    # Enregistre SW en production uniquement
```

---

## Infos de déploiement

| Service | URL / Identifiant |
|---|---|
| App en production | https://warranty-keep.vercel.app |
| Repo GitHub | https://github.com/davidb-wq/warranty-keep |
| Supabase projet | https://djsntrzximssohhluwti.supabase.co |
| Resend compte | davidblouin03@gmail.com |

## Lancer l'app localement

```bash
cd "C:\Users\Utilisateur\OneDrive\Documents\Mes projets\Application-facture-garantie\warranty-keep"
npm run dev
```
Ou double-cliquer sur `start-dev.bat`.
Ouvrir **http://localhost:3000**

## Déployer une mise à jour

```bash
cd "C:\Users\Utilisateur\OneDrive\Documents\Mes projets\Application-facture-garantie\warranty-keep"
git add -p          # Sélectionner les fichiers à commiter
git commit -m "description du changement"
git push            # Vercel redéploie automatiquement
```

## Ajouter les icônes PWA (optionnel)
Générer les icônes sur **pwabuilder.com** et les placer dans `public/icons/` :
- `icon-192x192.png`
- `icon-512x512.png`
- `icon-maskable-192x192.png`
- `icon-maskable-512x512.png`

---

## SQL Supabase (copier-coller dans le SQL Editor)

```sql
-- Table principale
create table public.warranties (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  purchase_date     date not null,
  warranty_months   int not null default 12,  -- -1 = lifetime
  physical_location text not null default '',
  notes             text,
  image_url         text,
  reminder_interval int not null default 3 check (reminder_interval in (3, 6)),
  created_at        timestamptz not null default now()
);

create index warranties_user_id_idx on public.warranties(user_id);

-- Vue pour le cron (exclut les garanties à vie)
create or replace view public.warranties_with_expiry as
select *, (purchase_date + (warranty_months * interval '1 month'))::date as expiry_date
from public.warranties where warranty_months != -1;

-- RLS
alter table public.warranties enable row level security;
create policy "select own" on public.warranties for select to authenticated using (auth.uid() = user_id);
create policy "insert own" on public.warranties for insert to authenticated with check (auth.uid() = user_id);
create policy "update own" on public.warranties for update to authenticated using (auth.uid() = user_id);
create policy "delete own" on public.warranties for delete to authenticated using (auth.uid() = user_id);

-- Storage RLS (après avoir créé le bucket warranty-images)
create policy "Users can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'warranty-images' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public read access"
  on storage.objects for select to public
  using (bucket_id = 'warranty-images');

create policy "Users can delete their own images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'warranty-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Règles de développement importantes

1. **`getUser()` côté serveur** — utilisé dans middleware et app layout (remplace `getClaims()`)
2. **Service Worker** — enregistré uniquement en production (`NODE_ENV === 'production'`)
3. **Path Storage** = `{user_id}/{warranty_id}.webp` — requis pour les policies RLS
4. **`SUPABASE_SERVICE_ROLE_KEY`** — jamais exposé côté client, seulement dans le cron
5. **Cron Vercel Hobby** — max 1x/jour → `0 9 1 * *` (1er du mois) est valide
6. **`reminder_interval`** — stocké par garantie (pas globalement), défaut = 3 mois
7. **Auth callback** — gère deux flux : `?code=` (PKCE) et `?token_hash=&type=` (confirm signup)
8. **Templates email Supabase** — configurés dans le dashboard Supabase (Auth > Email Templates), sources sauvegardées dans `supabase/email-templates/`

## Design

- Style ultra-minimaliste, thème clair/sombre automatique (`prefers-color-scheme`)
- Mobile-first, `max-w-md mx-auto` pour desktop
- Bottom nav fixe avec `pb-[env(safe-area-inset-bottom)]` pour iPhone
- `viewport-fit=cover` dans le viewport meta tag
- Couleurs par statut : vert (actif) / amber (expire bientôt ≤90j) / rouge (expiré) / gris (à vie)
- Classe utilitaire `.input` définie dans `globals.css`

## Tester le cron manuellement

```bash
node -e "
const https = require('https');
const options = {
  hostname: 'warranty-keep.vercel.app',
  path: '/api/cron',
  method: 'GET',
  headers: { 'Authorization': 'Bearer warranty-keep-cron-secret-2026' }
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});
req.on('error', e => console.error(e));
req.end();
"
```

Réponse attendue : `{"sent": N, "total": N}` — `sent` = nombre d'emails envoyés.

Le cron s'exécute automatiquement le **1er de chaque mois à 9h UTC** via Vercel.
