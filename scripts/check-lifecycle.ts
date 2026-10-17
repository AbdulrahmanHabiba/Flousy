import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {emptyState,validState,balances,debtRemaining,type State} from '../lib/money';
import {resetLedger,validConfirmation} from '../lib/lifecycle';
import {deletePlan,resetPlan,emptyResetPlan} from '../lib/account-actions';
import {themes,themeOf} from '../lib/themes';
const s:State={...emptyState,theme:'midnight',opening:{sad:10000,save:30000,spend:60000},initialized:true,savingsGoal:200000,debts:[{id:'d',direction:'owe',name:'شخص تجريبي',amount:5000,date:'2026-10-13',payments:[{id:'p',amount:1000,date:'2026-10-13'}]}]};
assert(validState(s));assert.equal(debtRemaining(s.debts![0]),4000);assert.equal(balances(s).total,100000);assert(!validState({...s,debts:[{...s.debts![0],payments:[{id:'bad',amount:6000,date:'2026-10-13'}]}]}));
const reset=resetLedger(s);assert(validState(reset));assert.equal(balances(reset).total,0);assert.equal(reset.debts?.length,0);assert.equal(reset.theme,'midnight');assert.equal(reset.savingPercent,30);assert(validConfirmation('0000'));for(const c of ['000','00000','٠٠٠٠',0,'delete'])assert(!validConfirmation(c));
assert.equal(themes.length,4);assert.equal(themes.filter(t=>t.mode==='dark').length,2);assert.equal(new Set(themes.map(t=>t.background)).size,4);assert.equal(themeOf('forest').id,'cream');
const data={emptyReset:emptyResetPlan('missing'),deleting:deletePlan('owner',4,true),stale:deletePlan('owner',3,true),empty:deletePlan('missing',0,false),reset:resetPlan('owner',4,JSON.stringify(reset)),staleReset:resetPlan('owner',3,JSON.stringify(reset))};
const python=`import sys,json,sqlite3
plans=json.load(sys.stdin)
def make():
 d=sqlite3.connect(':memory:');d.executescript('CREATE TABLE wallet_state(user_id TEXT PRIMARY KEY,payload TEXT,revision INTEGER);CREATE TABLE report_settings(user_id TEXT PRIMARY KEY,payload TEXT);CREATE TABLE report_deliveries(delivery_key TEXT PRIMARY KEY,user_id TEXT,status TEXT,payload TEXT);')
 for u in ['owner','other']:
  d.execute('INSERT INTO wallet_state VALUES(?,?,4)',(u,'{"money":123}'));d.execute('INSERT INTO report_settings VALUES(?,?)',(u,'{"requested":true,"email":"test@example.com"}'));d.execute('INSERT INTO report_deliveries VALUES(?,?,?,?)',(u+'pending',u,'pending','{"old":true}'));d.execute('INSERT INTO report_deliveries VALUES(?,?,?,?)',(u+'accepted',u,'accepted','{}'))
 d.commit();return d
def run(d,key):
 with d:
  for p in plans[key]:d.execute(p['sql'],p['args'])
d=make();run(d,'stale');assert d.execute('SELECT COUNT(*) FROM wallet_state').fetchone()[0]==2;assert d.execute('SELECT COUNT(*) FROM report_settings').fetchone()[0]==2;assert d.execute('SELECT COUNT(*) FROM report_deliveries').fetchone()[0]==4
run(d,'deleting')
for table in ['wallet_state','report_settings','report_deliveries']:assert d.execute('SELECT COUNT(*) FROM '+table+' WHERE user_id="owner"').fetchone()[0]==0
assert d.execute('SELECT COUNT(*) FROM wallet_state WHERE user_id="other"').fetchone()[0]==1
assert d.execute('UPDATE wallet_state SET payload="stale",revision=revision+1 WHERE user_id="owner" AND revision=4').rowcount==0
d=make();run(d,'staleReset');assert d.execute('SELECT revision FROM wallet_state WHERE user_id="owner"').fetchone()[0]==4
run(d,'reset');assert d.execute('SELECT revision FROM wallet_state WHERE user_id="owner"').fetchone()[0]==5
prefs=json.loads(d.execute('SELECT payload FROM report_settings WHERE user_id="owner"').fetchone()[0]);assert prefs['requested']==False
assert d.execute('SELECT status,payload FROM report_deliveries WHERE delivery_key="ownerpending"').fetchone()==('cancelled','{}');assert d.execute('SELECT status FROM report_deliveries WHERE delivery_key="owneraccepted"').fetchone()[0]=='accepted';assert d.execute('SELECT status FROM report_deliveries WHERE delivery_key="otherpending"').fetchone()[0]=='pending'
d.execute('INSERT INTO report_settings VALUES("missing","{}")');d.commit();run(d,'empty');assert d.execute('SELECT COUNT(*) FROM report_settings WHERE user_id="missing"').fetchone()[0]==0
d.execute('INSERT INTO report_settings VALUES(?,?)',('missing','{"requested":true}'));d.execute('INSERT INTO report_deliveries VALUES(?,?,?,?)',('missingpending','missing','pending','{"old":true}'));d.commit();run(d,'emptyReset');assert json.loads(d.execute('SELECT payload FROM report_settings WHERE user_id="missing"').fetchone()[0])['requested']==False;assert d.execute('SELECT status FROM report_deliveries WHERE user_id="missing"').fetchone()[0]=='cancelled'
print('PASS: actual SQLite delete/reset batches, version guards, user isolation, pending cancellation and stale-write rejection.')`;
console.log(execFileSync('python3',['-c',python],{input:JSON.stringify(data),encoding:'utf8'}).trim());
console.log('PASS: reset arithmetic/settings preservation, exact confirmation, debt partial/overpayment guards and four distinct themes.');
