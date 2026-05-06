# ZenGarantie — Guide de développement

## État du projet (mis à jour le 2026-05-06) — 100% opérationnel

| Service | URL / Identifiant |
|---|---|
| App production | https://zen-garantie.vercel.app |
| Repo GitHub | https://github.com/davidb-wq/zen-garantie |
| Supabase | https://djsntrzximssohhluwti.supabase.co |
| Brevo (emails) | solutionsvireo@gmail.com · SMTP login : `a805df001@smtp-brevo.com` |

## Stack
- **Next.js** App Router, TypeScript · **Tailwind CSS** + Lucide-React
- **Supabase** (auth OTP + OAuth + BDD + Storage privé) · **Vercel** (hosting + cron quotidien 9h UTC)
- **Brevo** SMTP (OTP auth) + API transactionnelle (rappels) · **react-image-crop** · **@zxing/browser**

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
├── types/{warranty,barcode}.ts
└── app/
    ├── page.tsx               # Landing publique, redirige si connecté
    ├── confidentialite/       # Politique Loi 25 — sans auth
    ├── (auth)/login/          # OTP 2 étapes + OAuth Google/Microsoft
    ├── (auth)/auth/callback/  # Gère ?code= (PKCE) et ?token_hash=
    ├── (app)/layout.tsx       # Auth guard + BottomNav + PolicyBanner
    ├── (app)/warranties/      # Liste + scanner code-barres
    ├── (app)/warranties/[id]/ # Détail + suppression + ImageLightbox
    ├── (app)/add/             # Formulaire création (photo obligatoire)
    ├── (app)/settings/        # Déco + export + install PWA
    └── api/
        ├── cron/route.ts      # Quotidien 9h UTC — logique roulante + envoi Brevo
        ├── export/route.ts    # GET JSON (droit portabilité Loi 25)
        ├── barcode/[upc]/     # UPCitemdb + Open Food Facts, cache CDN 24h
        └── pwa-icon/[size]/   # Icônes PWA dynamiques (edge runtime)
```

## Règles de développement critiques

1. **`getUser()` côté serveur** — dans middleware et app layout (jamais `getClaims()`)
2. **`SUPABASE_SERVICE_ROLE_KEY`** — jamais côté client, seulement dans `api/cron`
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
