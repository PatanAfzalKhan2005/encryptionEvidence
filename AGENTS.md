# Project: ImageSeal — image integrity verification

Single purpose: detect whether an uploaded image is byte-for-byte identical to a stored original using SHA-256. No AI/ML comparison, no roles, no case/evidence/custody workflows.

- Stack: TanStack Start v1 + Lovable Cloud (Supabase: Postgres, auth, storage). Keep `_authenticated/route.tsx` as is (`ssr: false`, redirect to `/auth`).
- Auth: email/password at `/auth` (sign in + create account). Every user only sees their own data (RLS `owner = auth.uid()`).
- Tables: `images` (original + sha256 + upload time) and `verifications` (original/check hashes, `matched`). Legacy forensic tables are deprecated and unused.
- Storage: private bucket `images`, paths `<user id>/<uuid>_<filename>`; displayed through signed URLs (`ImageThumb`).
- Hashing: `computeSHA256` in `src/lib/fx/format.ts` (Web Crypto) runs on the exact `File` that is then stored.
- Pages: `/dashboard` (stats, upload, original gallery, verification history) and `/verify` (pick original → upload copy → side-by-side result).
- Styling: tokens/component classes in `src/styles.css`; green = matched, red = modified.
