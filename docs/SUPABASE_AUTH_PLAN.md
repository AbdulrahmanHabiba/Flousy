# Supabase authentication — implementation status

## 2026-10-17
Independent Next.js application added in `standalone/`, sharing the existing Arabic ledger UI/domain code. PKCE Google start/callback, email signup/password signin, local signout, owner-scoped Postgres wallet/report preferences, CAS/idempotent retry and scoped reset/delete implemented. Existing owner-private Sites deployment/D1 wallets unchanged. No automatic email-based account mapping or financial migration.

The independent app schema was applied to the owner's chosen Flousy project. RLS restricts every exposed table to the user and a live Auth session. Privileged predicate is isolated in a private schema, read-only and scoped to actual auth.uid/session_id. Public RPCs use invoker rights. Security/performance advisors returned no findings. SQL fixture tests for CAS/idempotency, ownership, lifecycle and revoked-session denial passed and rolled back; no test users or wallets retained.

Provider discovery confirmed Google=false, email=true, signup enabled at inspection. Do not call Google live until configured and real browser sign-in/callback succeeds. `standalone/README.md` contains the concrete setup, redirect URLs, environment names and verification steps. SMTP may limit email confirmations until configured.

Next.js production build and TypeScript passed. Legacy Vinext build and finance/sync regression checks passed. Real OAuth/provider consent remains unverified. Account deletion currently removes application data; deletion of Supabase Auth identity itself needs a separate protected admin flow and is not claimed. Standalone email previews/PDF work with owned state; actual sends are explicitly unavailable until connected.

Vercel project discovery succeeded but team-scope lookup returned403 (insufficient scope). No new Vercel project/deployment was created. Owner can import GitHub Flousy with Root Directory=standalone from their own authorized account, or resolve the existing connector's scope. Do not retry unchanged credentials or assert reconnect is guaranteed to fix it.

Official references:
https://supabase.com/docs/guides/auth/social-login/auth-google
https://supabase.com/docs/guides/auth/server-side/creating-a-client
https://supabase.com/docs/guides/database/postgres/row-level-security
