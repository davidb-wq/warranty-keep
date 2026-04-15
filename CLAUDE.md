# ZenGarantie — Guide de développement

## État du projet (mis à jour le 2026-04-15 — auth OTP)

### ✅ Complété — Application 100% opérationnelle
- Tout le code source écrit (39 fichiers, 1782 lignes)
- `npm install` fait — `node_modules/` présent
- Node.js installé et dans le PATH système
- Repo GitHub : **https://github.com/davidb-wq/zen-garantie**
- Déploiement Vercel : **https://zen-garantie.vercel.app**
- Supabase configuré : table `warranties`, RLS, Storage bucket `warranty-images`, OTP activé
- Variables d'environnement configurées sur Vercel (6 variables)
- Resend configuré — emails envoyés depuis `onboarding@resend.dev`
- Cron mensuel testé et fonctionnel (1er du mois à 9h UTC)
- Email de test envoyé avec succès à `davidblouin03@gmail.com`
- **Auth OTP** — connexion et création de compte par code à 8 chiffres (remplace magic link) — compatible tous navigateurs et iOS Safari
- **Rate limit** — countdown 60s sur le bouton d'envoi, erreurs traduites en français
- **Templates email Supabase** — code OTP 8 chiffres avec `user-select:all` (Magic Link + Confirm signup), `{{ .Token }}`
- **Rappel par email** — 5 options disponibles (voir détail ci-dessous)
- **Cron corrigé** — logique roulante ancrée sur `purchase_date`, scan de toutes les garanties actives
- **Page d'accueil** — landing page publique sur `/` avec présentation de l'app et bouton de connexion
- **Supabase Redirect URL configurée** — `https://zen-garantie.vercel.app/auth/callback` dans le dashboard (Authentication → URL Configuration)
- **Upload photo corrigé** — deux boutons distincts (caméra + galerie), compression réduite à 800px, erreurs Supabase Storage affichées
- **Photo obligatoire** — champ photo requis à la création d'une garantie (astérisque rouge, bouton désactivé sans photo)
- **Message d'erreur mémoire** — si la compression échoue (manque de RAM sur l'appareil), message amber détaillé avec solutions affiché 30 secondes
- **Brevo SMTP configuré** — emails auth envoyés via Brevo (smtp-relay.brevo.com:587), plus de limite 2 emails/heure de Supabase
- **Édition garantie corrigée** — bouton "Enregistrer" actif si photo déjà existante (plus besoin de re-sélectionner une photo en mode édition)

### ⚠️ Limitation connue — Resend sans domaine custom
Resend en mode gratuit sans domaine vérifié ne peut envoyer **qu'à l'email du compte Resend** (`davidblouin03@gmail.com`).
Le compte ZenGarantie utilise `davidblouin.5@hotmail.com` → les rappels automatiques n'arriveront pas à cette adresse.

**Solutions :**
- **Option A (rapide)** : Vérifier `davidblouin.5@hotmail.com` dans Resend → resend.com → Settings → Emails
- **Option B (complète)** : Ajouter un domaine custom sur Resend → envoie à tous les utilisateurs

### 🔧 Reste à faire (optionnel)
- **Ajouter les icônes PWA** — générer sur pwabuilder.com et placer dans `public/icons/`
- **Vérifier email Hotmail sur Resend** — pour recevoir les rappels sur le bon compte

---

## Décisions prises
- **Auth :** OTP 8 chiffres uniquement (pas de mot de passe, pas de magic link) — compatible tous navigateurs incluant Safari iOS
- **Email auth (OTP) :** Brevo SMTP (`smtp-relay.brevo.com:587`) — 300 emails/jour gratuits, pas de limite Supabase
- **Email rappels (cron) :** Resend (`onboarding@resend.dev`) — 3000 emails/mois gratuits
- **Utilisateurs :** Multi-utilisateurs avec RLS Supabase
- **Nom :** ZenGarantie

## Stack technologique
- **Framework :** Next.js (App Router, TypeScript) — version actuelle installée
- **Styles :** Tailwind CSS + Lucide-React
- **Auth & BDD :** Supabase (tier gratuit)
- **Stockage images :** Supabase Storage (1GB) — compression client-side avant upload
- **Hébergement :** Vercel (tier gratuit)
- **Emails auth :** Brevo (SMTP custom Supabase) — login Supabase : `a805df001@smtp-brevo.com`
- **Emails rappels :** Resend (3000 emails/mois gratuits)

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
        ├── layout.tsx             # Root layout, metadata PWA, <SWRegister>
        ├── manifest.ts            # PWA manifest (display: standalone)
        ├── globals.css            # Tailwind + classe .input + pb-safe
        ├── page.tsx               # Landing page publique — forwarde ?code/?token_hash vers /auth/callback, redirige si déjà connecté
        ├── not-found.tsx
        ├── (auth)/
        │   ├── layout.tsx         # Layout centré (pas de bottom nav)
        │   ├── login/page.tsx     # Flux OTP 2 étapes : email → code 8 chiffres → verifyOtp → /warranties
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
                ├── sw-register.tsx        # Enregistre SW en production uniquement
                └── auth-hash-handler.tsx  # Détecte #access_token= (hash fragment) et redirige vers /warranties
```

---

## Infos de déploiement

| Service | URL / Identifiant |
|---|---|
| App en production | https://zen-garantie.vercel.app |
| Repo GitHub | https://github.com/davidb-wq/zen-garantie |
| Supabase projet | https://djsntrzximssohhluwti.supabase.co |
| Resend compte | davidblouin03@gmail.com |
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
5. **Cron Vercel Hobby** — max 1x/jour → `0 9 1 * *` (1er du mois) est valide
6. **`reminder_interval`** — stocké par garantie (pas globalement), 5 valeurs acceptées :
   - `1` — Chaque mois (roulant depuis la date d'achat)
   - `3` — Chaque 3 mois (roulant depuis la date d'achat)
   - `12` — Chaque année (roulant depuis la date d'achat)
   - `-3` — 3 mois avant l'expiration (ponctuel, une seule fois)
   - `-6` — 6 mois avant l'expiration (ponctuel, une seule fois)
   - Valeurs négatives = rappels ponctuels avant expiration; positives = rappels roulants ancrés sur `purchase_date`
   - Champ obligatoire, pas de défaut
7. **Auth OTP** — `signInWithOtp({ email })` sans `emailRedirectTo` → Supabase envoie un code 8 chiffres. Vérification : `verifyOtp({ email, token, type: 'email' })`. Fonctionne sur tous les navigateurs (pas de PKCE, pas de redirect).
8. **Auth callback** — toujours en place pour le flux `?token_hash=&type=` (confirm signup legacy) et `?code=` (PKCE si jamais utilisé)
9. **Templates email Supabase** — configurés dans le dashboard (Auth > Email Templates), variable `{{ .Token }}` pour le code OTP, `user-select:all` pour faciliter la copie. Sources dans `supabase/email-templates/`. OTP expiry = 3600s (1 heure).
10. **Brevo SMTP** — Supabase → Authentication → Sign In / Providers → SMTP Settings. Host: `smtp-relay.brevo.com`, Port: `587`, Username: `a805df001@smtp-brevo.com`. Sender: `davidblouin03@gmail.com` / `ZenGarantie`. Remplace le serveur email intégré de Supabase (limité à 2/h).
11. **Supabase Redirect URL** — `https://zen-garantie.vercel.app/auth/callback` dans Authentication → URL Configuration → Redirect URLs
12. **Upload photo** — deux inputs séparés : `capture="environment"` (caméra) et sans capture (galerie). `maxWidthOrHeight: 800` pour réduire la mémoire canvas. Limite 20 Mo avant compression. Photo obligatoire à la création.
13. **Erreur mémoire compression** — catch retourne le code `'MEMORY_ERROR'`, affiche un message amber 30s avec solutions (fermer apps, utiliser galerie). Erreur Supabase Storage affichée à l'utilisateur si upload échoue.

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
  hostname: 'zen-garantie.vercel.app',
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
