# ZenGarantie — Guide de développement

## État du projet (mis à jour le 2026-04-20 — Conformité Loi 25 Québec ajoutée)

### ✅ Complété — Application 100% opérationnelle
- Tout le code source écrit
- `npm install` fait — `node_modules/` présent
- Node.js installé et dans le PATH système
- Repo GitHub : **https://github.com/davidb-wq/zen-garantie**
- Déploiement Vercel : **https://zen-garantie.vercel.app**
- Supabase configuré : table `warranties`, RLS, Storage bucket `warranty-images`, OTP activé
- Variables d'environnement configurées sur Vercel (8 variables — `BREVO_API_KEY` ajouté, `CRON_SECRET` renforcé)
- Cron quotidien testé et fonctionnel (tous les jours à 9h UTC = 5h heure de Québec EDT)
- Email de rappel envoyé avec succès via Brevo à tous les utilisateurs
- **Auth OTP** — connexion et création de compte par code à 8 chiffres (remplace magic link) — compatible tous navigateurs et iOS Safari
- **Auth OAuth** — boutons "Continuer avec Google" et "Continuer avec Microsoft" sur la page login, flux PKCE via `/auth/callback`
- **Rate limit** — countdown 60s sur le bouton d'envoi, erreurs traduites en français
- **Templates email Supabase** — code OTP 8 chiffres avec `user-select:all` (Magic Link + Confirm signup), `{{ .Token }}`
- **Rappel par email** — 5 options disponibles (voir détail ci-dessous)
- **Cron corrigé** — logique roulante ancrée sur `purchase_date`, scan de toutes les garanties actives
- **Cron logs d'erreur** — erreurs Brevo loguées avec status + body, compteur `errors` = tentatives échouées seulement
- **Page d'accueil** — landing page publique sur `/` avec présentation de l'app et bouton de connexion
- **Supabase Redirect URL configurée** — `https://zen-garantie.vercel.app/auth/callback` dans le dashboard (Authentication → URL Configuration)
- **Upload photo corrigé** — deux boutons distincts (caméra + galerie), compression réduite à 800px, erreurs Supabase Storage affichées
- **Photo obligatoire** — champ photo requis à la création d'une garantie (astérisque rouge, bouton désactivé sans photo)
- **Message d'erreur mémoire** — si la compression échoue (manque de RAM sur l'appareil), message amber détaillé avec solutions affiché 30 secondes
- **Brevo SMTP configuré** — emails auth envoyés via Brevo (smtp-relay.brevo.com:587), plus de limite 2 emails/heure de Supabase
- **Rappels cron migrés vers Brevo** — `src/app/api/cron/route.ts` utilise l'API transactionnelle Brevo au lieu de Resend — envoie à n'importe quelle adresse email
- **Édition garantie corrigée** — bouton "Enregistrer" actif si photo déjà existante (plus besoin de re-sélectionner une photo en mode édition)
- **PWA install prompt** — bottom sheet à la première visite (Android : bouton natif / iOS : instructions Share) + option permanente dans Paramètres → Application
- **Icônes PWA générées dynamiquement** — route `/api/pwa-icon/[size]` via `ImageResponse`, manifest mis à jour (plus besoin de fichiers PNG manuels)
- **Audit sécurité complété** — aucune clé secrète dans git, CRON_SECRET renforcé (64 chars hex aléatoires), double vérification auth cron (`x-vercel-cron` + Bearer), security headers HTTP ajoutés
- **Wording email rappel neutralisé** — sujet : `Rappel de garantie — "X"` (plus de "expire bientôt") ; corps : "Voici un rappel pour la garantie suivante :" — cohérent avec les rappels roulants (chaque mois/3 mois/an) et les rappels ponctuels avant expiration
- **Conformité Loi 25 Québec** — politique de confidentialité publique à `/confidentialite`, avis sur la page de connexion, section Confidentialité dans Paramètres (export JSON, suppression de compte)

### 🔧 Reste à faire (optionnel)
- **Signed URLs pour Storage** — les photos de garanties sont actuellement en accès public (URL directe). Migrer vers des signed URLs Supabase pour restreindre l'accès aux propriétaires authentifiés (conformité Loi 25 complète)

---

## Décisions prises
- **Auth :** OTP 8 chiffres + OAuth Google + OAuth Microsoft (Azure) — compatible tous navigateurs incluant Safari iOS
- **Email auth (OTP) :** Brevo SMTP (`smtp-relay.brevo.com:587`) — 300 emails/jour gratuits, pas de limite Supabase
- **Email rappels (cron) :** Brevo API transactionnelle (`api.brevo.com/v3/smtp/email`) — 300 emails/jour gratuits, envoie à tous les utilisateurs
- **Utilisateurs :** Multi-utilisateurs avec RLS Supabase
- **Nom :** ZenGarantie

## Stack technologique
- **Framework :** Next.js (App Router, TypeScript) — version actuelle installée
- **Styles :** Tailwind CSS + Lucide-React
- **Auth & BDD :** Supabase (tier gratuit)
- **Stockage images :** Supabase Storage (1GB) — compression client-side avant upload
- **Hébergement :** Vercel (tier gratuit)
- **Emails auth :** Brevo (SMTP custom Supabase) — login Supabase : `a805df001@smtp-brevo.com`
- **Emails rappels :** Brevo API transactionnelle (300 emails/jour gratuits)

## Structure des fichiers

```
warranty-keep/
├── .env.local                     # Jamais commité — À CRÉER
├── .env.example                   # Modèle avec les clés vides
├── .gitignore
├── next.config.ts                 # Headers SW + security headers HTTP (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
├── tailwind.config.ts             # darkMode: 'media', tokens sémantiques
├── tsconfig.json                  # target ES2017 ajouté automatiquement
├── vercel.json                    # Cron job : 0 9 * * * (tous les jours, 9h UTC)
├── package.json
├── start-dev.bat                  # Script de lancement local (contournement PATH)
│
├── public/
│   ├── sw.js                      # Service worker (network-first, prod uniquement)
│   └── favicon.ico                # À AJOUTER (optionnel)
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
    ├── middleware.ts              # Refresh token Supabase + redirect si non-auth ; redirige `/` et `/login` → `/warranties` si connecté
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts          # createBrowserClient
    │   │   └── server.ts          # createServerClient (cookies)
    │   ├── image-compression.ts   # browser-image-compression → 0.5MB max, WebP
    │   └── warranty-utils.ts      # getExpiryDate, getWarrantyStatus, STATUS_STYLES
    ├── types/
    │   └── warranty.ts            # interface Warranty, WarrantyStatus
    └── app/
        ├── layout.tsx             # Root layout, metadata PWA, <SWRegister>, capture beforeinstallprompt globale
        ├── manifest.ts            # PWA manifest (display: standalone) — icônes via /api/pwa-icon/[size]
        ├── globals.css            # Tailwind + classe .input + pb-safe
        ├── page.tsx               # Landing page publique — forwarde ?code/?token_hash vers /auth/callback, redirige si déjà connecté
        ├── not-found.tsx
        ├── confidentialite/
        │   └── page.tsx           # Politique de confidentialité publique — 10 sections, Loi 25 Québec, accessible sans auth
        ├── (auth)/
        │   ├── layout.tsx         # Layout centré (pas de bottom nav)
        │   ├── login/page.tsx     # Boutons OAuth (Google, Microsoft) + flux OTP 2 étapes : email → code 8 chiffres → verifyOtp → /warranties
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
        │   └── settings/page.tsx  # Déconnexion + info rappels + bouton install PWA
        ├── api/
        │   ├── cron/route.ts      # Cron quotidien : scan + envoi Brevo API
        │   ├── export/route.ts    # GET — téléchargement des garanties en JSON (droit à la portabilité, Loi 25)
        │   └── pwa-icon/[size]/route.tsx  # Icônes PWA générées dynamiquement (ImageResponse, edge runtime)
        └── components/
            ├── ui/
            │   ├── bottom-nav.tsx          # 3 tabs, fixed bottom, safe-area-inset
            │   ├── warranty-card.tsx       # Carte avec bordure colorée + badge lieu
            │   ├── expiry-badge.tsx        # Pill coloré selon statut
            │   ├── install-sheet.tsx       # Bottom sheet PWA install (1ère visite) — Android + iOS
            │   ├── install-settings-row.tsx  # Ligne install dans Paramètres (permanente)
            │   └── delete-account-button.tsx  # Bouton suppression compte — confirmation 2 étapes, nettoie Storage + BDD + auth
            ├── forms/
            │   ├── warranty-form.tsx   # Formulaire add/edit partagé
            │   └── image-upload.tsx    # Camera/file + compression + preview
            └── providers/
                ├── sw-register.tsx          # Enregistre SW en production uniquement
                ├── auth-hash-handler.tsx    # Détecte #access_token= (hash fragment) et redirige vers /warranties
                └── pwa-install-provider.tsx # Injecte <InstallSheet> dans le layout app
    └── hooks/
        └── use-pwa-install.ts  # Détection Android/iOS, beforeinstallprompt, localStorage dismissed
```

---

## Infos de déploiement

| Service | URL / Identifiant |
|---|---|
| App en production | https://zen-garantie.vercel.app |
| Repo GitHub | https://github.com/davidb-wq/zen-garantie |
| Supabase projet | https://djsntrzximssohhluwti.supabase.co |
| Brevo compte | davidblouin03@gmail.com |
| Brevo SMTP login | a805df001@smtp-brevo.com |

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
  reminder_interval int not null check (reminder_interval in (1, 3, 12, -3, -6)),
  -- Positif = roulant (tous les N mois depuis purchase_date)
  -- Négatif = ponctuel (une fois à N mois avant expiration)
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
5. **Cron Vercel Hobby** — max 1x/jour → `0 9 * * *` (tous les jours à 9h UTC)
6. **`reminder_interval`** — stocké par garantie (pas globalement), 5 valeurs acceptées :
   - `1` — Chaque mois (roulant depuis la date d'achat)
   - `3` — Chaque 3 mois (roulant depuis la date d'achat)
   - `12` — Chaque année (roulant depuis la date d'achat)
   - `-3` — 3 mois avant l'expiration (ponctuel, une seule fois)
   - `-6` — 6 mois avant l'expiration (ponctuel, une seule fois)
   - Valeurs négatives = rappels ponctuels avant expiration; positives = rappels roulants ancrés sur `purchase_date`
   - Champ obligatoire, pas de défaut
7. **Auth OTP** — `signInWithOtp({ email })` sans `emailRedirectTo` → Supabase envoie un code 8 chiffres. Vérification : `verifyOtp({ email, token, type: 'email' })`. Fonctionne sur tous les navigateurs (pas de PKCE, pas de redirect).
8. **Auth OAuth** — `signInWithOAuth({ provider, options: { redirectTo: origin + '/auth/callback' } })`. Providers actifs : `google`, `azure` (Microsoft/Outlook/Hotmail/Live). Secrets gérés dans Supabase dashboard (Authentication → Providers), jamais dans le code. Flux PKCE — le callback `/auth/callback` échange le `?code=` via `exchangeCodeForSession()`.
9. **Auth callback** — gère `?code=` (PKCE OAuth), `?token_hash=&type=` (confirm signup legacy). Erreur → redirect `/login?error=auth_failed`.
9. **Templates email Supabase** — configurés dans le dashboard (Auth > Email Templates), variable `{{ .Token }}` pour le code OTP, `user-select:all` pour faciliter la copie. Sources dans `supabase/email-templates/`. OTP expiry = 3600s (1 heure).
10. **Brevo SMTP** — Supabase → Authentication → Sign In / Providers → SMTP Settings. Host: `smtp-relay.brevo.com`, Port: `587`, Username: `a805df001@smtp-brevo.com`. Sender: `davidblouin03@gmail.com` / `ZenGarantie`. Remplace le serveur email intégré de Supabase (limité à 2/h).
11. **Supabase Redirect URL** — `https://zen-garantie.vercel.app/auth/callback` dans Authentication → URL Configuration → Redirect URLs
12. **Upload photo** — deux inputs séparés : `capture="environment"` (caméra) et sans capture (galerie). `maxWidthOrHeight: 800` pour réduire la mémoire canvas. Limite 20 Mo avant compression. Photo obligatoire à la création.
13. **Erreur mémoire compression** — catch retourne le code `'MEMORY_ERROR'`, affiche un message amber 30s avec solutions (fermer apps, utiliser galerie). Erreur Supabase Storage affichée à l'utilisateur si upload échoue.
14. **PWA install prompt** — `beforeinstallprompt` capturé dans un script inline dans `<body>` (avant hydration React) → stocké dans `window.__pwaInstallPrompt`. Le hook `use-pwa-install.ts` le lit au `useEffect`. Dismissal persisté dans `localStorage` clé `pwa-install-dismissed`. La sheet (1ère visite) respecte ce flag ; la ligne Paramètres l'ignore (toujours accessible).
15. **Icônes PWA** — générées dynamiquement via `ImageResponse` à `/api/pwa-icon/[size]` (edge runtime). Manifest pointe vers ces routes. Plus besoin de fichiers PNG statiques dans `public/icons/`.

## Design

- Style ultra-minimaliste, thème clair/sombre automatique (`prefers-color-scheme`)
- Mobile-first, `max-w-md mx-auto` pour desktop
- Bottom nav fixe avec `pb-[env(safe-area-inset-bottom)]` pour iPhone
- `viewport-fit=cover` dans le viewport meta tag
- Couleurs par statut : vert (actif) / amber (expire bientôt ≤90j) / rouge (expiré) / gris (à vie)
- Classe utilitaire `.input` définie dans `globals.css`

## Conformité Loi 25 Québec

### Pages et fonctionnalités ajoutées
- **`/confidentialite`** — politique de confidentialité publique (hors route groups `(auth)` et `(app)`), accessible sans connexion
- **Avis de connexion** — texte + lien vers `/confidentialite` en bas de la page `/login`, après le formulaire email (couvre OTP + OAuth)
- **Paramètres → Confidentialité** — 3 actions : exporter données (JSON), voir politique, supprimer compte

### Suppression de compte (`deleteAccount` Server Action dans `settings/page.tsx`)
Ordre d'opération critique :
1. Récupérer les IDs des garanties (`select('id')`)
2. Supprimer les photos dans Storage (`warranty-images/{user_id}/{warranty_id}.webp`)
3. Supprimer les lignes de la table `warranties`
4. Supprimer l'utilisateur auth via `admin.auth.admin.deleteUser(user.id)` — nécessite `SUPABASE_SERVICE_ROLE_KEY`
5. Redirect vers `/login`

### Export données (`/api/export`)
- Route GET, protégée (retourne 401 si non authentifié)
- Retourne JSON avec `exported_at`, `user_email`, `warranties[]`
- Header `Content-Disposition: attachment` pour déclencher le téléchargement
- Le lien dans Paramètres utilise `<a href="/api/export" download>` (pas un Server Action — les Server Actions ne peuvent pas streamer des fichiers)

### Middleware — aucun changement nécessaire
`/confidentialite` n'est ni dans `isAppRoute` ni dans les redirects `/login`/`/`, donc passe sans redirection pour tous les utilisateurs.

---

## Tester le cron manuellement

Remplace `TON_CRON_SECRET` par la valeur de `CRON_SECRET` dans `.env.local` :

```bash
node -e "
const https = require('https');
const options = {
  hostname: 'zen-garantie.vercel.app',
  path: '/api/cron',
  method: 'GET',
  headers: { 'Authorization': 'Bearer TON_CRON_SECRET' }
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

Réponse attendue : `{"sent": N, "attempted": N, "total": N, "errors": N}`
- `sent` = emails envoyés avec succès
- `attempted` = utilisateurs avec un rappel dû aujourd'hui
- `total` = garanties actives non expirées
- `errors` = tentatives d'envoi échouées (Brevo)

Le cron s'exécute automatiquement **tous les jours à 9h UTC = 5h du matin heure de Québec (EDT)** via Vercel.
