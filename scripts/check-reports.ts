import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dailyReport,emailHtml} from '../lib/reports/model';
import {reportPdf} from '../lib/reports/pdf';
import {fontBase64} from '../lib/reports/font';
import {emptyState,fundsOf,incomeSplit,validState,splitWithRates,monthSummary,type State} from '../lib/money';
const s:State={...emptyState,initialized:true,entries:[{id:'a',kind:'income',amount:100000,note:'دخل تجريبي - ليس من بياناتك',date:'2026-10-08',pocket:'spend',savingPercent:30},{id:'b',kind:'expense',amount:15000,note:'مواصلات ومشتريات',date:'2026-10-08',pocket:'spend',savingPercent:30},{id:'c',kind:'expense',amount:2000,note:'مساعدة',date:'2026-10-08',pocket:'sad',savingPercent:30}]};
const r=dailyReport(s,'2026-10-08');assert.equal(r.closing.total,83000);assert.equal(r.closing.sad,8000);assert.equal(r.closing.save,30000);assert.equal(r.closing.spend,45000);assert.equal(r.spent,17000);
const next=dailyReport(s,'2026-10-09');assert.equal(next.rows.length,0);assert.equal(next.opening.total,83000);assert.equal(next.income,0);
assert(!emailHtml(dailyReport({...s,pocketNames:{sad:'<script>x</script>',save:'ادخار',spend:'مصروف'}},r.date),'https://example.com').includes('<script>'));
const out=process.argv[2];if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/Folousy_Email_Preview.html',emailHtml(r,'https://habiba-ledger.poetichen1.chatgpt.site'));fs.writeFileSync(out+'/Folousy_Daily_Sample.pdf',reportPdf(r,fontBase64));fs.writeFileSync(out+'/Multipage_QA.pdf',reportPdf({...r,rows:Array.from({length:85},(_,i)=>({...s.entries[1],id:String(i),note:'وصف طويل لاختبار التفاف السطر وتوزيع العمليات على أكثر من صفحة بدون قطع أي مبلغ'}))},fontBase64));}
console.log('PASS: allocations, withdrawals, carryover, empty day, HTML escaping.');
// Custom fund migration, snapshots, rounding and time preferences.


const base=fundsOf(s);const configured:State={...s,funds:[{...base[2],percent:40,color:'#FF6347'},{...base[0],percent:15},{...base[1],percent:25},{id:'fund_trip',name:'رحلة',color:'#7856AB',percent:20,motto:'رحلة تستاهل'}],opening:{...s.opening,fund_trip:0}};
assert(validState(configured));assert.equal(monthSummary(configured,'2026-10').end.total,83000);assert.equal(monthSummary(configured,'2026-10').end.fund_trip,0);
const snap=incomeSplit(10000,configured);assert.deepEqual(snap.allocations,{spend:4000,sad:1500,save:2500,fund_trip:2000});
const withIncome={...configured,entries:[...configured.entries,{id:'new',kind:'income' as const,amount:10000,date:'2026-10-09',note:'new split',pocket:'spend',savingPercent:25,...snap}]};assert(validState(withIncome));
const reordered={...withIncome,funds:[...configured.funds!].reverse().map(f=>({...f,percent:f.id==='spend'?70:f.id==='sad'?0:f.id==='save'?30:0}))};assert.equal(dailyReport(reordered,'2026-10-09').closing.fund_trip,2000);assert.equal(dailyReport(reordered,'2026-10-09').closing.save,32500);
for(let n=1;n<=300;n++){const split=splitWithRates(n,snap.rates);assert.equal(Object.values(split).reduce((a,b)=>a+b,0),n);assert(Object.values(split).every(v=>Number.isInteger(v)&&v>=0));}
assert(!validState({...configured,funds:configured.funds!.map(f=>({...f,percent:1}))}));assert(!validState({...configured,funds:[...configured.funds!,configured.funds![0]]}));
assert.equal(fundsOf(emptyState)[0].name,'صدقة');
console.log('PASS: fourth fund, reorder, changed rates, historic snapshots, 300 rounding cases and rejected invalid totals/duplicate IDs.');

import {validSettings} from '../lib/reports/settings';
import {gmailMime} from '../lib/reports/gmail';
for(const time of ['00:00','08:37','23:59'])assert(validSettings({email:'owner@example.com',requested:true,time,timezone:'Africa/Cairo'}));
for(const time of ['24:00','9:00','12:60','bad'])assert(!validSettings({email:'owner@example.com',requested:true,time,timezone:'Africa/Cairo'}));
const mail={from:'فلوسي | التقرير اليومي <reports@example.com>',to:['owner@example.com'],subject:'فلوسي التقرير اليومي بتاريخ الثامن من أكتوبر سنة ألفين وستة وعشرين',html:'<p>ملخص</p>',text:'ملخص',attachments:[{filename:'report.pdf',content:'JVBERg==',content_type:'application/pdf'}]};
const mime=Buffer.from(gmailMime(mail,'test'),'base64url').toString('utf8');
assert(mime.includes('multipart/alternative'));assert(mime.includes('filename="report.pdf"'));assert(mime.includes('\r\n '));
assert([...mime.matchAll(/=\?UTF-8\?B\?[^?]+\?=/g)].every(m=>m[0].length<=75));
assert.throws(()=>gmailMime({...mail,subject:'hello\r\nBcc: attacker@example.com'},'test'));
console.log('PASS: arbitrary valid report times, invalid times, MIME parts, folded Arabic headers and rejected header injection.');
