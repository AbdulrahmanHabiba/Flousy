import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const origin=process.env.TEST_APP_ORIGIN||'http://localhost:3000';
async function get(path,options={}){return fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(20000),...options});}
const home=await get('/login');assert.equal(home.status,200);assert.match(await home.text(),/Google/);
for(const path of ['/api/state','/api/reports','/api/reports/settings']){
 const r=await get(path);assert.equal(r.status,401,path);assert.match(r.headers.get('cache-control')??'',/no-store/);
}
const csrf=await get('/auth/email',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
const invalid=await get('/auth/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'signin',email:'invalid',password:'short'})});assert.equal(invalid.status,400);
const write=await get('/api/state',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(write.status,401);
const callback=await get('/auth/callback');assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),origin+'/login?auth_error=callback');
const forged=await get('/api/state',{headers:{cookie:'sb-forged-auth-token=not-a-valid-session'}});assert.equal(forged.status,401);
if(process.env.TEST_GOOGLE_DISABLED==='1'){
 const google=await get('/auth/google');assert.equal(google.status,303);assert.equal(google.headers.get('location'),origin+'/login?auth_error=google_setup');assert.match(google.headers.get('cache-control')??'',/no-store/);
}
console.log('PASS: Google entry renders; anonymous APIs denied/no-store; CSRF/invalid email blocked; callback bounded; forged cookie denied. Real OAuth success still pending.');
