# Daily email operations

## Current state
HTML preview, editable report preferences, authenticated PDF export, Resend and Gmail API send adapters and a server-side due-report function are implemented. Resend plugin access is connected and confirmed by a read-only call, but the account has no sending domains. No runtime sender credentials or scheduler trigger are configured. No real email has been sent. The UI accurately shows pending connection.

## Existing runtime
React/TypeScript App Router source, Vinext/Vite build, Cloudflare Workers runtime, D1 SQLite. Node >=22.13 is a build/development requirement, not an Express server. The auth is Sign in with ChatGPT. App data is keyed by user_id.

## Sending
Set RESEND_API_KEY as a production secret and REPORTS_FROM as an approved From address. Prefer `فلوسي <no-reply@YOUR_VERIFIED_DOMAIN>` after domain verification. REPORTS_SITE_ORIGIN is the actual Site URL. No placeholder sender or domain is claimed to be owned. Resend test-domain restrictions must be checked in the connected account before testing.

GET /api/reports/settings returns own settings plus sender/scheduler availability. POST saves the user's email, desired enablement and any valid HH:mm Cairo preference. GET /api/reports?date=YYYY-MM-DD returns escaped HTML. `format=pdf` returns generated A4 PDF. POST /api/reports/send sends the selected day's report to the user's saved recipient, guarded by existing user auth and same-origin checks.

The outgoing email contains HTML plus text fallback and base64 PDF attachment. Pending payloads are frozen in D1 before sending; accepted payloads are removed. A stable key `daily-v1/userId/date` prevents repeat daily sends. Acceptance by the provider is not proof of inbox delivery; inspect provider status/webhooks. Old ambiguous attempts over 23h are blocked for manual review because provider idempotency expires.

Changing recipient applies to future newly prepared reports, not an already prepared retry. The same date is not resent after acceptance. A separate explicitly authorized corrected-report workflow would need a new version key, not deleting delivery records.

## Scheduler connection still required
`lib/reports/scheduler.ts: runDueReports(now)` is a server-only function. It checks Cairo local time, desired enablement and sender configuration, and sends due reports with stable date keys. It is NOT a deployed cron trigger by itself. Do not set REPORTS_SCHEDULE_CONNECTED=true until an actual supported platform trigger invokes it and is verified while the app is closed.

For the current Sites deployment, inspect supported scheduler/MCP integration. Do not add unsupported manifest cron fields. A Sites scheduled task requires a verified authenticated report-send tool, not a public unauthenticated endpoint. If moving to Supabase, implement the authenticated job in Edge Functions and invoke through pg_cron with secrets stored server-side; adapt the data layer from D1 to Postgres after a backed-up migration. Do not create an automation that lacks access to current private wallet data.

A production scheduler needs retries with a frozen target date after midnight, provider status tracking, and a missed-job recovery policy. The current due-time function only matches the specified minute; a retry outside that minute needs the explicit target date and server auth. Never silently describe this as reliable delivery until those operational steps pass.

## Verification before enablement
- Read connected sender account and verified domain.
- Confirm recipient and verify ownership when the address changes in a future public app.
- Configure production secrets through runtime environment management, never source/docs/client JS.
- Send one authorized sample to the saved recipient and verify rendered Gmail body, PDF Arabic and inbox attachment.
- Verify the selected Cairo time including daylight saving through Africa/Cairo; never hard-code UTC+2/+3.
- Close the app and verify one real scheduled run; retry must not duplicate.
- Update the history with actual scheduler identity and sender/domain, never the API key.

## References
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/functions/examples/send-emails
https://resend.com/docs/api-reference/emails/send-email
https://resend.com/docs/dashboard/emails/idempotency-keys

## No-domain Gmail option (2026-10-08 update)
The owner has no domain and intends to create a dedicated Gmail account. Suggested address: [private mailbox omitted] only if available; availability has not been checked. Display name: فلوسي | التقرير اليومي. Gmail's actual address remains visible in sender details. Do not impersonate a no-reply address on an unowned domain.

A server-only Gmail API adapter is implemented in lib/reports/gmail.ts. Set REPORTS_PROVIDER=gmail, REPORTS_FROM to the actual connected mailbox with the display name, GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN securely after an OAuth offline-access grant for gmail.send. The adapter renews access tokens and sends base64url MIME containing HTML, text and PDF. No OAuth setup/consent screen, production secret or account connection has been completed. Connecting a ChatGPT Gmail plugin does not itself provision runtime OAuth credentials. Never request the ordinary Gmail password. A future alternative is a dedicated worker with SMTP/app-password support, subject to account eligibility; the current Cloudflare adapter uses the HTTP Gmail API.

Gmail has no Resend-style delivery idempotency key: a CAS pending-to-attempting claim blocks duplicate/ambiguous retries. If a timeout or uncertain provider result occurs, inspect Sent/provider state before resetting manually. This favors no duplicate reports over automatic blind retries. Refresh-token expiration/revocation and Google OAuth app publishing/testing limits require operational review before unattended use.

The saved time is the dispatch target, not a guarantee of inbox arrival to the exact minute. Current runDueReports generates the current Cairo calendar day's report at the selected time; 00:00 therefore describes the new day and should not be recommended for end-of-day reporting without implementing previous-day targeting. Default23:59 remains appropriate. Scheduler is not connected, regardless of saved requested=true.

## Typography and print
App and PDF: locally served IBM Plex Sans Arabic Regular/SemiBold with Inter numerals. PDF embeds fonts and includes generation date/time in Cairo. HTML email declares the same stack, but Gmail may not load custom fonts; Tahoma/Arial remain readable fallbacks. Do not promise exact web-font rendering in Gmail. Email/PDF share current configurable fund names/order and historical allocation snapshots.

Official references: https://developers.google.com/workspace/gmail/api/guides/sending ; https://developers.google.com/identity/protocols/oauth2/web-server

## Confirmed mailbox spelling and accounting update
Owner states [private mailbox omitted] is available. Treat this as the intended dedicated mailbox address, correcting the earlier suggestion [private mailbox omitted]. No account OAuth or runtime credentials are obtained from that statement; do not call it connected. Do not automatically set it as report recipient without knowing whether it is sender-only or also intended destination.
Reports classify transfers as internal and external charity as outside own money. External total is separately labeled and excluded from own income/spending/balances. PDF/HTML include both source and destination of new transfers; historical borrow/repay compatibility remains. Guest wallet stays on device and has print/export, but no server email from guest data; never read cloud data based only on client state.

## 2026-10-13 data lifecycle
Reset financial ledger preserves fund configuration/theme but clears opening balances, entries, checks, optional debts and savings goal. Server reset disables requested reporting and cancels unaccepted frozen deliveries/clears their payloads, retaining accepted metadata for deduplication. sendReport rejects cancelled snapshots. An already in-flight provider request cannot be recalled, and an already received email cannot be deleted by this feature. Account deletion removes wallet_state, report_settings and report_deliveries rows for the authenticated user in a guarded D1 batch. It does not delete the external ChatGPT/Google account or provider-retained emails. Guest reset/deletion are local only. No live owner's account/financial records were deleted while implementing or testing. Google/email direct auth and Gmail/scheduler connection remain pending.

## 2026-10-14 local-first reporting boundary
Ledger writes now enqueue locally and synchronize inbackground. Manualemail send is disabled whilelocalchanges pending; reportiframe/API PDF reflects lastserver snapshot and UI explicitlysaysso. Clientsummary/ledger print includes currentlocalwallet anddeclarespendingstatus. Automaticemail jobs can only seecloudacceptedrecords; noactualjob connected. Revisiontimeouts use exactsnapshotretry andserveridempotentpayload acceptance, avoidingduplicateentries.
