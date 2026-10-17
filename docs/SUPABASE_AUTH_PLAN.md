# Flousy Google authentication — setup and migration

## Latest verified state — 2026-10-17 (supersedes the October14 blocker)
The owner created Flousy successfully. Management access verified project `YOUR_PROJECT_REF`, organization `YOUR_ORGANIZATION_ID` (AbdulrahmanHabiba), region `eu-west-1`, status `ACTIVE_HEALTHY`. API URL: https://YOUR_PROJECT_REF.supabase.co . Public schema table inspection returned no tables. No schema changes, credentials retrieval, financial migration or OAuth activation was performed in this documentation update. The unrelated Food Ordering Project remains untouched.

The earlier cost/create-project blocker below is historical and resolved by owner creation. Current application still uses D1 + platform ChatGPT identity. A ready project is not a completed persistence/auth migration. Google provider settings have not been inspected or verified; do not assert enabled or disabled without checking actual settings.

## Historical record (2026-10-14)

## Verified state, 2026-10-14
Supabase plugin connected and read-only list_projects/list_organizations/get_organization succeeded. Owner selected organization AbdulrahmanHabiba, idYOUR_ORGANIZATION_ID. Free organizationplan reported by get_organization, but the exact new-project cost is not confirmed. Existing project Food Ordering Project (UNRELATED_PROJECT_OMITTED), eu-central-1, INACTIVE, is unrelated and untouched.
get_cost for a newproject returned UNAVAILABLE: MCP tool get_cost was not returned by tools/list. create_project requires a real cost-confirmationID, which has not been obtained; no fabricatedID/no assumedprice/no projectcreation performed.

## Concrete new project
Name Flousy, organization AbdulrahmanHabiba, proposed region eu-central-1 (Frankfurt). Create an independent project after actualcost confirmation through supported management or ownerdashboard. Do not reuse/restore the unrelated foodproject. Verify ACTIVE_HEALTHY and projectAPI URL fromactualresponse; no placeholders treated asrealcredentials.

## Why Google is not enabled now
Current Site has dispatch-owned ChatGPT identity/privateaccess and D1 wallet keyed by thatidentity. An emailaddress does not register an OAuthclient. Supabase connector access is managementauthorization, not end-userGoogle signin. Need actual SupabaseAuth project, GoogleCloudWebOAuthclient and registeredorigins/callback, plus an applicationhosting/authpath thatsupportsapp-ownedsignin without requiring a secondChatGPTgate. Preserve currentSite/accountdatauntilverifiedmigration; do not silentlyreplaceorpublicize it.

## Google setup (verified officialdocs)
1. GoogleCloud project for Flousy; configure audience/branding/scopes openid,email,profile only.
2. Webapplication OAuthclient. AuthorizedJavaScriptorigin is actualdeployedapporigin (not invented/purchaseddomain).
3. AuthorizedredirectURI is exactSupabaseAuthcallback copiedfromnewprojectGoogleprovider settings.
4. Put ClientID/ClientSecret into SupabaseGoogleprovider, enableprovider. Secret never infrontend/source/docs/chat.
5. SupabaseSiteURL/redirectallowlist contains actualapplicationcallback. Use PKCE and verifiedserverclaims/user.
6. GoogleSigninbutton triggers realOAuth; callback exchangescode/session. Test accountisolation, logout, reload, deniedconsent andGoogleprofile metadata asdisplayonly. Do notuseeditableuser_metadata forownership.

## Data migration plan
Export currentD1JSON and revisions. Preserve all entry/fund/debt/check IDs, allocations and minorunits. Explicitowner-controlled mapping from currentChatGPTID to newSupabaseuserID; never auto-link byunverifiedemail. Relational walletJSON+revision row references auth.users.id ONDELETECASCADE; RLS select/insert/update/delete ownsrows via(selectauth.uid())=user_id andWITHCHECK; no anonwrites. Current puremoney/sync/profile/printmodules reusable. Dataaccess adapter replacement requires backed-upimport and exacttotals/entrycountcomparison before cutover.
Deletion inSupabase must revoke/sessioninvalidate for sensitiveops and deleteownedrows plusAuthuser through serveradminAPI; deletinguseralone doesnotimmediatelyinvalidateoldaccessJWT. Secrets/service-role never inbrowser. Current appdeletion onlyD1rows and cannotclaimdeletingnotyetconnectedGoogle identity.

## Verification before claiming complete
RealuserGooglelogin, accountB cannotreadA, JSONimportkeepsidentity, queuededup/conflicts, exactmoneybalancecomparison, pendingdeletionsandprovideraccountlogout. Actualscheduledemail stillseparatependingwork.

## References
https://supabase.com/docs/guides/auth/social-login/auth-google
https://developers.google.com/identity/openid-connect/openid-connect
https://supabase.com/docs/guides/auth/server-side/creating-a-client
https://supabase.com/docs/guides/database/postgres/row-level-security
