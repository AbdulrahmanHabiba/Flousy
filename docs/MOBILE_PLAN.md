# Folousy mobile implementation plan

## Product contract
Arabic-first RTL personal tracker for Abdulrahman Habiba. iOS and Android. Vertically stacked configurable funds: three defaults صدقة / الادخار / المصاريف at10/30/60%, plus custom funds. Names/colors/order/mottos/percentages editable; percentages integer0–100 and total100. Keep minimal entry: amount required, note optional, date today by default, save repeatedly, clear/refocus. No mandatory savings repayment ledger. Native app is a later project; it has not been built here.

## Proposed stack
React Native + Expo + TypeScript. Decide versions from current official docs when starting. Expo Router, SQLite for local pending writes, shared domain package, Supabase Auth/Postgres/Storage/Edge Functions if the owner approves the migration at implementation. Gmail API is the no-domain sender option; Resend remains optional with a verified domain. Both sender connection and scheduler are pending. Prefer built-in primitives and minimal dependencies; reuse Tailwind conventions with NativeWind only if it adds useful consistency. Do not replace cloud data without importing and comparing the existing D1 record.

## Proposed monorepo
apps/web: existing web tracker adapter.
apps/mobile: Expo application, routes, native components, local database/sync.
packages/domain: money, allocation, date validation, reports model, schemas.
packages/design: colors, spacing, type sizes, localization tokens.
packages/email: transactional HTML and plain-text report builders.
services/reports: authenticated sender, scheduler, snapshots and delivery logs.
supabase/migrations: owner-scoped relational schema and RLS.
docs: history, decisions, screens, prompts, release checklist.

## Screens
1. Home: current Arabic month, compact income row, all configured full-width stacked fund cards, balances and percentages, review action.
2. Income: numeric keyboard, optional source, calendar, live split, chronological notebook.
3. Fund notebook: amount, optional note, optional changed date, remaining balance, incoming/outgoing rows, edit/delete.
4. Settings: fund names/colors/order/mottos, future-income percentages, add fund, eight themes, opening correction, export, report recipient/time/toggle.
5. Balance review: actual amount per fund; difference=actual-expected; negative difference means an unexplained shortage, never auto-invent an expense.
6. Reports: date, HTML summary, native PDF preview/share/download, sender status, accepted/delivered distinction.
7. Login/onboarding: minimal account and one-time import; no complicated budgeting categories.

## Data model proposal
profiles(user_id, currency, timezone)
funds(id,user_id,key,name,color,percent,motto,position)
income(id,user_id,amount_minor,date,note,rates_json,created_at,updated_at)
allocations(income_id,fund_key,amount_minor)
transactions(id,user_id,fund_key,amount_minor,kind,date,note,client_id,revision)
opening_balances(user_id,fund_key,amount_minor)
reconciliation(id,user_id,date,expected_json,actual_json)
report_preferences(user_id,email,time,timezone,enabled,verified_at)
report_snapshots(id,user_id,target_date,payload_hash,payload,created_at)
report_deliveries(snapshot_id,status,provider_id,retry_at)

All money remains integer Egyptian piastres. Allocation stores its original percentage; settings never recalculate past incomes. New splits use deterministic largest-remainder rounding; legacy incomes retain the old expense-residual arithmetic. Transfer entries are balanced, cannot count as external income or spending, and legacy borrow/repay is imported without surfacing debt prompts. RLS checks auth.uid()=user_id. Server secrets never go into Expo public environment.

## Offline and synchronization
Generate stable client UUIDs. Write transactions locally first with pending status. Push through authenticated API with revision/CAS. Never overwrite server snapshots last-write-wins silently. Conflict UI preserves both entries for review. A report includes only synced records and declares its snapshot cutoff. Device caches do not change a past emailed attachment.

## Migration phases
A. Freeze and export current JSON, capture revision and totals, preserve all IDs.
B. Extract lib/money.ts and reports/model.ts into shared package without changing arithmetic.
C. Build native screens and keyboard/safe-area/RTL behavior with mock data clearly labeled.
D. Implement Supabase auth/RLS and import adapter; compare each fund and all transaction counts against D1.
E. Add offline queue/conflicts and email preference ownership verification.
F. Connect report worker, A4 generation, retry/deduplication and delivery feedback.
G. Test real Android/iPhone devices, accessibility, font scaling and offline recovery; release preview builds before app stores.

## Acceptance scenarios
Income100 => صد10/save30/spend60. With savings20 future income100 =>10/20/70, first split remains unchanged. Withdrawing20 from savings30 =>10 savings and no repayment prompt. Multiple entries save without closing sheet. Editing/deleting income adjusts each affected fund once. Opening balance carries to later months. Late backdated entries adjust reports regenerated later, not the already sent PDF. Cross-user access fails. Negative real-vs-expected mismatch is clearly marked. Duplicate network request inserts once. Multi-page PDF never loses a row. Reporting time tracks Cairo DST.

## Master implementation prompt
You are implementing Folousy for iOS and Android using React Native/Expo/TypeScript. Read docs/Folousy_Project_History.txt and MOBILE_PLAN.md before edits. Preserve the owner's vertical configurable-fund and fast notebook contract exactly. Extract and reuse pure accounting/report rules. Keep integer minor units and income allocation snapshots. Implement real auth, owner-scoped storage, offline queue and conflict handling. Do not fake sender/scheduler readiness. Use Arabic RTL, safe areas, accessible touch targets, native numeric keyboard, and minimal restrained surfaces. Deliver a working native app incrementally, test the financial scenarios and update the handoff for every meaningful change. Keep proposed versus implemented work explicit.

## Design prompt
DESIGN PRIORITY: Visual quality is a first-class requirement, not a secondary enhancement. Spend significant effort refining spacing, surfaces, typography, micro-interactions, and visual consistency. Produce a native-feeling Arabic RTL financial notebook with one clear action per surface. All configured fund cards are vertical on every screen size: default green صدقة, blue savings, coordinated red expenses. Keep generous spacing and high-contrast typography; subtle motion, reduced-motion support, consistent outline icons. Do not add charts/categories/sidebar/steps unless requested. A native app can refine aesthetics, but cannot change the accounting contract.

## Latest customizability and acceptance update
Use lib/themes.ts exact eight palettes and IBM Plex Sans Arabic + Inter from the web implementation. Reuse State.funds, theme and Entry.rates/allocations snapshots. Percent/order changes must never recalculate older income. Preserve original sad/save/spend IDs and imported legacy data; new fund has opening0 and no retroactive allocations. Current web guard permits3–12 funds. Native screens must include percentage-total validation, move controls and optional fund motto. Report preference accepts any24h HH:mm and Arabic date/time; dispatcher must track Cairo DST. Gmail fallback typography is a documented platform limitation. Test customfourthfund, reorderedfunds,300 minorunit rounding cases, invalidsum rejection and editing historicincome with its originalrates.

Continuation prompt: Read the latest history section first; it overrides the original fixed10/20or30 contract. Implement configurable fundlist and eight themes while keeping verticalcards/quicknotebook. Do not require a domain when using authorized GmailOAuth. Do not claim mobile app, OAuth or scheduled email exists until built/connected/tested.

## Manual additions, external charity, history and guest update
Web now implements transfer(kind,source,pocket,sourceMode): debit source, credit destination, total unchanged. The UI alias total means available expenses (spend), not a fourth ledger account. Only new external money belongs in income; do not count transfers as income or expense. External charity(kind=external,pocket=sad) records donations from outside the owner's money with zero entryImpact and a separate summary, and is included in search/reports under its own label. Monthly basis is gross incoming allocation+transfers, distinct from carryover and closing balance; paying all charity does not erase basis.

Port HistoryPanel month summaries/search across notes/date/type/fund/source/destination/amount with month/fund filters. Theme choices are behind a compact expandable menu. Account screen follows supplied white minimalist reference with wallet mark, two-line large title and restrained actions. Existing cloud auth is ChatGPT; direct Google/email are explicitly unconnected choices pending an actual auth service. Web guest uses localStorage with revisions/CAS and backup; native guest should use SQLite. Guest-to-cloud import requires explicit confirmation and preservation/conflict detection, never silent overwrite. Website remains owner-private at platform boundary; true anonymous access outside that boundary requires a deliberate access-policy/auth deployment. Email provided by owner is [private mailbox omitted] (not earlier suggested folousy...). Mailbox ownership/OAuth not independently verified and recipient role not confirmed.

Native acceptance: income1000 ->100/300/600, transfer200spend->save and50save->sad ->150/450/400,total1000; external70 leaves all balances unchanged; charity150spent ->0/450/400,total850, charitymonthlybasis150 retained. Novembercarries850 withnewbasis0/external0.

## 2026-10-13 UI/lifecycle refinement
Four distinct themes now offered: ink/cream light and dark/midnight dark; legacy themes map to one of these four without losing wallet data. Funds have restrained own-color gradients; total remaining appears directly below income. Header keeps four icons in one row, account/reconciliation moved into settings. Account page redesigned as concise 100svh entry surface, short-height compact rules; no forced desktop slogan imitation. Keep accessibility fallback for enlarged text rather than clipping controls.

Port confirmed0000 ledger reset and app-data deletion, owner authorization, CAS guards, transactional scoped database deletion, report cancellation, and no stale state recreation. External auth/provider deletion is a separate operation that is not currently connected. Add optional collapsed debt/savings settings: owe/lent principal, dated partial payments, remaining, no overpayments, optional savings target/progress. These records do not move wallet money; actual cash movements must be logged separately. Reset/deletion includes these records.

## 2026-10-14 fast entry and shortage policy
Port lib/entry-plan.ts: shortage choice offers expenses first, then savings/other configured funds, coverage amount equals deficit; commit transfer and expense together. Never silently overdraft; block transfer/edit/remove/import that creates/worsens a dated negative balance. Keep legacy deficits visible and unchanged until an explicit correction.
Port SyncQueue with SQLite durable account-scoped outbox, foreground accepted immediately after durable local write, sequential network snapshots, CAS revision and exact payload retry after ambiguous timeout. Restore pending edits after verified identity, retain conflicts for review/export. One active writer tab/device context in currentweb; serverCAS protects others. Do not rely on beforeunload delivery; queued data must survive browser closure.
Profile icon/initial opens name/email, local appdisplayname editing, JSON export/import with validated replace/merge and fingerprint deduplication. Debts merge too; opening balances explicitly add inmerge. Sameoldsnapshot re-import prevented untilresetclearsreceipts. Loginidentity never imported fromJSON. Print summary daily/monthly single page; separateledger header+summaryonce, repeatedtablehead and naturalpagination. Pendinglocal data declared andserveremail disabled untilsync.
Supabaseplugin nowconnected andorganization AbdulrahmanHabiba chosenbyowner. OnlyexistingFoodOrderingProject isINACTIVE andunrelated; nochangesmade. get_cost toolreturnedUNAVAILABLE fromtools/list, so no newFlousyproject orcostconfirmation created. See SUPABASE_AUTH_PLAN.md forexactGoogle setup andmigrationboundary.
