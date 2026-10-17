import {reportStore,readReportSettings,readWallet,deliveryConfig} from './server';
import {dailyReport,emailHtml,plainText} from './model';
import {reportPdf} from './pdf';
import {fontBase64} from './font';
import {gmailAccessToken,gmailMime,type GmailPayload} from './gmail';
export async function sendReport(userId:string,date:string){
 const cfg=deliveryConfig();if(!cfg.ready||!cfg.from)throw Error('خدمة الإرسال لم تتصل بعد. المعاينة والتحميل متاحان.');
 const prefs=await readReportSettings(userId);if(!prefs.email)throw Error('احفظ بريد الاستلام أولًا.');
 const db=await reportStore();const deliveryKey=`daily-v1/${userId}/${date}`;
 let row=await db.prepare('SELECT status,provider_id,payload,created_at FROM report_deliveries WHERE delivery_key=?').bind(deliveryKey).first<{status:string;provider_id:string|null;payload:string;created_at:string}>();
 if(row?.status==='cancelled')throw Error('أُلغيت نسخة التقرير السابقة عند تصفير الدفتر.');
 if(row?.status==='accepted')return {alreadySent:true,id:row.provider_id};
 // Freeze the exact payload before the first request so safe retries cannot change it.
 if(!row){const report=dailyReport(await readWallet(userId),date);const payload=JSON.stringify({from:cfg.from,to:[prefs.email],subject:`فلوسي | تقريرك اليومي - ${date}`,html:emailHtml(report,cfg.origin),text:plainText(report),attachments:[{filename:`Folousy-${date}.pdf`,content:Buffer.from(reportPdf(report,fontBase64)).toString('base64'),content_type:'application/pdf'}]});
 await db.prepare('INSERT OR IGNORE INTO report_deliveries(delivery_key,user_id,status,created_at,payload) VALUES (?,?,?,?,?)').bind(deliveryKey,userId,'pending',new Date().toISOString(),payload).run();
 row=await db.prepare('SELECT status,provider_id,payload,created_at FROM report_deliveries WHERE delivery_key=?').bind(deliveryKey).first<{status:string;provider_id:string|null;payload:string;created_at:string}>();}
 if(!row)throw Error('تعذر تجهيز الإرسال.');
 if(row.status==='accepted')return {alreadySent:true,id:row.provider_id};
 // Resend keys expire after 24h. Never blindly retry an ambiguous old request.
 if(Date.now()-Date.parse(row.created_at)>23*3600000)throw Error('الإرسال السابق يحتاج مراجعة قبل إعادة المحاولة لتجنب التكرار.');
 if(cfg.provider==='gmail'){
 if(row.status==='attempting')throw Error('محاولة Gmail السابقة تحتاج مراجعة؛ لن نرسل نسخة مكررة تلقائيًا.');
 const token=await gmailAccessToken(cfg.gmail);const raw=gmailMime(JSON.parse(row.payload) as GmailPayload,deliveryKey);
 const claim=await db.prepare("UPDATE report_deliveries SET status='attempting' WHERE delivery_key=? AND status='pending'").bind(deliveryKey).run();if(!claim.meta.changes)throw Error('توجد محاولة إرسال أخرى لهذا التقرير.');
 const res=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({raw}),signal:AbortSignal.timeout(20000)});const result=await res.json() as {id?:string};if(!res.ok||!result.id)throw Error('تعذر تأكيد إرسال Gmail. راجع المحاولة قبل الإعادة.');await db.prepare("UPDATE report_deliveries SET status='accepted',provider_id=?,payload='{}' WHERE delivery_key=?").bind(result.id,deliveryKey).run();return {alreadySent:false,id:result.id};
 }
 if(row.status==='attempting')throw Error('محاولة سابقة تحتاج مراجعة قبل تغيير خدمة الإرسال.');
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${cfg.key}`,'Content-Type':'application/json','Idempotency-Key':deliveryKey},body:row.payload,signal:AbortSignal.timeout(20000)});
 const body=await response.json() as {id?:string};if(!response.ok||!body.id)throw Error('مزود البريد لم يقبل الإرسال. راجع ربط خدمة الإرسال وعنوان المرسل.');
 await db.prepare("UPDATE report_deliveries SET status='accepted',provider_id=?,payload='{}' WHERE delivery_key=?").bind(body.id,deliveryKey).run();return {alreadySent:false,id:body.id};
}
