import {getChatGPTUser} from '../../chatgpt-auth';
import {reportStore} from '../../../lib/reports/server';
import {resetLedger,validConfirmation} from '../../../lib/lifecycle';
import {deletePlan,resetPlan,emptyResetPlan} from '../../../lib/account-actions';
import type {State} from '../../../lib/money';
export async function DELETE(request:Request){return manage(request,true);}
export async function POST(request:Request){return manage(request,false);}
async function manage(request:Request,deleting:boolean){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول أولًا.'},{status:401});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'طلب غير مسموح.'},{status:403});
 try{const b=await request.json() as {confirmation:string;revision:number};if(!validConfirmation(b.confirmation)||!Number.isSafeInteger(b.revision)||b.revision<0)return Response.json({error:'اكتب الرمز 0000 لتأكيد العملية.'},{status:400});
 const db=await reportStore();const row=await db.prepare('SELECT payload,revision FROM wallet_state WHERE user_id=?').bind(user.userId).first<{payload:string;revision:number}>();
 if((row?.revision??0)!==b.revision)return Response.json({error:'الدفتر اتغير. حدّث الصفحة قبل المتابعة.'},{status:409});
 if(deleting){
 // All deletions share a version guard and commit in one D1 batch. Delete the guard row last.
 const result=await db.batch(deletePlan(user.userId,b.revision,!!row).map(p=>db.prepare(p.sql).bind(...p.args)));
 const remains=await db.prepare('SELECT revision FROM wallet_state WHERE user_id=?').bind(user.userId).first();
 if(remains||row&&!result[2].meta.changes)return Response.json({error:'الدفتر اتغير. لم يتم حذف الحساب.'},{status:409});
 return Response.json({deleted:true});
 }
 if(!row){await db.batch(emptyResetPlan(user.userId).map(p=>db.prepare(p.sql).bind(...p.args)));return Response.json({revision:0,state:null});}
 const next=resetLedger(JSON.parse(row.payload) as State),payload=JSON.stringify(next);
 const result=await db.batch(resetPlan(user.userId,b.revision,payload).map(p=>db.prepare(p.sql).bind(...p.args)));
 if(!result[0].meta.changes)return Response.json({error:'الدفتر اتغير. حدّث الصفحة قبل التصفير.'},{status:409});return Response.json({state:next,revision:b.revision+1});
 }catch{return Response.json({error:'تعذر إتمام العملية. لم نؤكد الحذف؛ أعد تحميل الدفتر قبل المحاولة.'},{status:503});}
}
