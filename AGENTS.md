# Working on Folousy

Read docs/Folousy_Project_History.txt before changing product behavior. It is the project's human/AI handoff record.

For every meaningful change in this repository:
1. Preserve the owner's simple vertically stacked funds (three default funds plus user-added funds) and fast notebook entry flow.
2. Update the handoff's current state, folder map, decisions, validation, pending work and chronological history before handoff.
3. Distinguish implemented, tested, deployed, connected and proposed capabilities. Never mark scheduled email as active without a connected sender, working scheduler and end-to-end verification.
4. Keep secrets, personal financial records and auth tokens out of documentation, source archives and screenshots.
5. Keep comments in English and product text in Arabic/RTL.
6. Preserve the Site project ID and owner-private audience. Use Sites hosting workflow for this project.
7. Internal transfers conserve total money; external charity never affects personal balances, income or expenses. Keep monthly gross funding distinct from remaining/carryover. Guest mode is explicit device-local storage; do not expose cloud data to anonymous users or claim Google/email auth is connected before real setup.
8. Source migrations must preserve existing wallet JSON, revisions, income allocation snapshots and legacy transactions.
9. Refresh the downloadable TXT/source archive when delivering an update. External Notion/Library copies are snapshots and must be explicitly updated; a file does not self-update outside the repository.

The TXT is a curated record of visible requirements and verified work, not a verbatim chat transcript or private reasoning log.

Destructive account operations require authenticated scope, same-origin checks, literal0000 confirmation and revision guard. Do not execute them against production user data as QA. Account deletion applies to app-owned D1 rows, not the external identity provider. Four current themes preserve legacy IDs through themeOf mapping. Optional debt payments are tracking records only and do not auto-move funds. Reset cancels pending report snapshots and disables requested reports.

New entry/edit/removal/import must not create or worsen negative dated balances. Expense shortage requires explicit coverage source and atomic transfer+expense. Preserve existing legacy data without inventing corrections. Cloud writes are local-durable optimistic snapshots, serialized in SyncQueue with exact retry/CAS and account-scoped cache; do not revert fast entry to awaiting network. Destructive actions flush pending writes before server action and clear the current account's cache. Summary print is bounded one page; ledger summary appears once and the table flows across pages. Google connection must not be confused with connected Supabase MCP access.

The standalone/ workspace is a separate Next.js/Supabase deployment, not the hosted Sites application. Preserve the existing Sites identity/access and default platform-auth UI behavior. Shared client components accept explicit authMode; domain logic is reused, not duplicated. standalone/ must verify Supabase users via Auth and enforce RLS/CAS/live-session checks. Do not claim provider activation from code alone, auto-link old accounts by email, or migrate private D1 records without explicit import. Public handoff files contain product/engineering context only; full conversation/owner operations history stays private.
