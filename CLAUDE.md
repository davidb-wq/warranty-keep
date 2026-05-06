# ZenGarantie — Guide de développement

## État du projet (mis à jour le 2026-05-06) — 100% opérationnel — Partage familial actif

| Service | URL / Identifiant |
|---|---|
| App production | https://zen-garantie.vercel.app |
| Repo GitHub | https://github.com/davidb-wq/zen-garantie |
| Supabase | https://djsntrzximssohhluwti.supabase.co |
| Brevo (emails) | solutionsvireo@gmail.com · SMTP login : `a805df001@smtp-brevo.com` |

## Stack
- **Next.js** App Router, TypeScript · **Tailwind CSS** + Lucide-React
- **Supabase** (auth OTP + OAuth + BDD + Storage privé + RLS) · **Vercel** (hosting + cron quotidien 9h UTC)
- **Brevo** SMTP (OTP auth) + API transactionnelle (rappels + invitations) · **react-image-crop** · **@zxing/browser**

## Commandes

```bash
# Local
cd "C:\Users\Utilisateur\OneDrive\Documents\Mes projets\Application-facture-garantie\warranty-keep"
npm run dev   # → http://localhost:3000

# Déployer
git add -p && git commit -m "..." && git push
```

## Structure des fichiers clés

```
src/
├── middleware.ts              # Refresh token + redirect non-auth ; / et /login → /warranties si connecté
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── image-compression.ts   # 0.5MB max, WebP
│   ├── policy-version.ts      # CURRENT_POLICY_VERSION — changer déclenche bannière chez tous
│   └── warranty-utils.ts      # getExpiryDate, getWarrantyStatus, STATUS_STYLES
├── types/{warranty,barcode,share}.ts
└── app/
    ├── page.tsx               # Landing publique, redirige si connecté
    ├── confidentialite/       # Politique Loi 25 — sans auth
    ├── share/accept/          # Acceptation invitation — hors groupe (app), pas protégé middleware
    ├── (auth)/login/          # OTP 2 étapes + OAuth Google/Microsoft ; honore ?redirect=
    ├── (auth)/auth/callback/  # Gère ?code= (PKCE) et ?token_hash=
    ├── (app)/layout.tsx       # Auth guard + BottomNav + PolicyBanner
    ├── (app)/warranties/      # Liste unifiée (propres + partagées) + scanner code-barres
    ├── (app)/warranties/[id]/ # Détail ; isShared = warranty.user_id !== user.id (lecture seule si vrai)
    ├── (app)/add/             # Formulaire création (photo obligatoire)
    ├── (app)/settings/        # Déco + export + install PWA + section Partage
    └── api/
        ├── cron/route.ts      # Quotidien 9h UTC — logique roulante + envoi Brevo
        ├── export/route.ts    # GET JSON (droit portabilité Loi 25)
        ├── share/invite/      # POST — crée shared_access + envoie email Brevo
        ├── share/[id]/        # DELETE — révoque un partage (soft delete status='revoked')
        ├── barcode/[upc]/     # UPCitemdb + Open Food Facts, cache CDN 24h
        └── pwa-icon/[size]/   # Icônes PWA dynamiques (edge runtime)
```

## Règles de développement critiques

1. **`getUser()` côté serveur** — dans middleware et app layout (jamais `getClaims()`)
2. **`SUPABASE_SERVICE_ROLE_KEY`** — jamais côté client ; utilisé dans `api/cron`, `api/share/*` et `share/accept` uniquement
3. **Path Storage** = `{user_id}/{warranty_id}.webp` — stocker chemin relatif dans `image_url`, jamais l'URL complète
4. **Upload édition** — pas de policy UPDATE Storage → `remove([path])` puis `upload({ upsert: false })`
5. **Signed URLs** — générées côté serveur, durée 1h ; gère chemin relatif ET ancienne URL complète via `split('/warranty-images/')[1]`
6. **Auth OTP** — `signInWithOtp({ email })` sans `emailRedirectTo` → code 8 chiffres ; vérif : `verifyOtp({ email, token, type: 'email' })`
7. **Auth OAuth** — providers `google` + `azure`, secrets dans Supabase dashboard uniquement
8. **Auth callback** — gère `?code=` (PKCE) et `?token_hash=&type=` ; erreur → `/login?error=auth_failed`
9. **Scanner (@zxing/browser)** — `await import(...)` dans `useEffect` uniquement (crash SSR sinon) ; `decodeFromConstraints` pour iOS Safari ; ignorer `NotFoundException`
10. **Limite scans** — localStorage `scan-usage` = `{ date, count }` ; 3/jour ; `davidblouin03@gmail.com` exempté
11. **`reminder_interval`** — 5 valeurs : `1`/`3`/`12` roulants ; `-3`/`-6` ponctuels avant expiration
12. **Modals plein écran** — `z-[9999]` pour couvrir la bottom nav
13. **Bannière politique** — changer `CURRENT_POLICY_VERSION` dans `policy-version.ts` pour déclencher chez tous
14. **Suppression compte** — ordre : Storage → warranties BDD → `admin.deleteUser()` → redirect `/login`
15. **Export données** — `<a href="/api/export" download>` (pas Server Action — ne peut pas streamer)
16. **Cron** — double vérif : `x-vercel-cron` header + Bearer token ; réponse `{ sent, attempted, total, errors }`
17. **Service Worker** — enregistré en production uniquement (`NODE_ENV === 'production'`)
18. **Vues Supabase** — toujours créer avec `security_invoker = on` (`ALTER VIEW nom SET (security_invoker = on)`) pour respecter le RLS ; sinon la vue s'exécute avec les droits du créateur et contourne les politiques
19. **Partage familial** — table `shared_access` ; token 256 bits, expire 48h ; page `share/accept` utilise service role pour lookup ET update (vérifications email/expiry côté serveur) ; `isShared = warranty.user_id !== user.id` côté serveur pour lecture seule ; liste unifiée via `.or('owner_id.eq.X,invitee_id.eq.X')` + `sharedBy` badge
20. **RLS partage** — `invitee_read` + `owner_read_invitee_warranties` sur `warranties` (bidirectionnel) ; policies `shared_access` toutes en rôle `authenticated` ; `auth.email()` (JWT) et non `SELECT email FROM auth.users` (pas de grant)
21. **Login redirect** — `?redirect=` honoré après OTP et OAuth ; guard : `startsWith('/') && !startsWith('//')` anti open-redirect
22. **CSP** — `Content-Security-Policy` dans `next.config.ts` ; connexions restreintes à Supabase + Brevo

## Design
- Ultra-minimaliste · thème clair/sombre auto (`prefers-color-scheme`) · mobile-first `max-w-md mx-auto`
- Bottom nav fixe · `pb-[env(safe-area-inset-bottom)]` + `viewport-fit=cover`
- Statuts : vert (actif) / amber (≤90j) / rouge (expiré) / gris (à vie) · classe `.input` dans `globals.css`

## Fonctionnalités complètes
- Auth OTP 8 chiffres (Brevo SMTP) + OAuth Google + Microsoft — tous navigateurs incl. Safari iOS
- Photos privées (bucket privé, signed URLs 1h) + recadrage (react-image-crop) + compression WebP
- Scanner code-barres (@zxing/browser) — UPCitemdb + Open Food Facts — analyse garantie en français
- Cron quotidien Brevo — rappels roulants ET ponctuels selon `reminder_interval`
- PWA installable — icônes dynamiques edge, install sheet 1ère visite
- Conformité Loi 25 — `/confidentialite`, bannière changement politique, export JSON, suppression compte
- **Partage familial** — invitation par email (Brevo), token 48h, acceptation auto, liste unifiée bidirectionnelle, lecture seule pour garanties partagées, révoquer/quitter depuis les paramètres

## Sécurité (résumé)
- RLS Supabase sur toutes les tables — rôle `authenticated` uniquement sur `shared_access`
- Tokens d'invitation : 256 bits (32 octets hex), expiration 48h
- `share/accept` : service role pour lookup + update ; email/expiry vérifiés côté serveur avant toute action
- `auth.email()` dans les policies RLS (lit le JWT) — jamais `SELECT FROM auth.users`
- CSP header + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy
- Open redirect bloqué : guard `startsWith('/') && !startsWith('//')` sur tous les `?redirect=`
- Storage policies bidirectionnelles pour images partagées (invitee + owner)
