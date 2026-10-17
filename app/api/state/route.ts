import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '../../../db/raw';
import {budgetViolation} from '../../../lib/entry-plan';
import { emptyState, validState, type State } from '../../../lib/money';
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول لحفظ بياناتك.'},{status:401});
 try{const row=await database().prepare('SELECT payload, revision FROM wallet_state WHERE user_id = ?').bind(user.userId).first<{payload:string;revision:number}>();return Response.json({state:row?JSON.parse(row.payload):emptyState,revision:row?.revision??0,user:{id:user.userId,name:user.displayName,email:user.email}},{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'تعذر تحميل بياناتك. حاول مرة أخرى.'},{status:503});}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'سجّل الدخول أولًا.'},{status:401});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'طلب غير مسموح.'},{status:403});
 try{const body=await request.json() as {state:State;revision:number};if(!validState(body.state)||!Number.isSafeInteger(body.revision)||body.revision<0)return Response.json({error:'راجع المبالغ والتواريخ.'},{status:400});
 const db=database();const existing=await db.prepare('SELECT payload,revision FROM wallet_state WHERE user_id=?').bind(user.userId).first<{payload:string;revision:number}>();if((existing?.revision??0)!==body.revision){if(existing?.payload===JSON.stringify(body.state))return Response.json({revision:existing.revision});return Response.json({error:'نسخة الخادم اتغيرت. التغييرات المحلية محفوظة للمراجعة.'},{status:409});}if(budgetViolation(existing?JSON.parse(existing.payload):emptyState,body.state))return Response.json({error:'الرصيد لا يكفي. غطّ الفرق من صندوق آخر أولًا.'},{status:400});const result=body.revision===0?await db.prepare('INSERT OR IGNORE INTO wallet_state (user_id,payload,revision) VALUES (?,?,1)').bind(user.userId,JSON.stringify(body.state)).run():await db.prepare('UPDATE wallet_state SET payload=?,revision=revision+1 WHERE user_id=? AND revision=?').bind(JSON.stringify(body.state),user.userId,body.revision).run();
 if(!result.meta.changes){const same=await db.prepare('SELECT payload,revision FROM wallet_state WHERE user_id=?').bind(user.userId).first<{payload:string;revision:number}>();if(same?.payload===JSON.stringify(body.state))return Response.json({revision:same.revision});return Response.json({error:'البيانات اتغيرت في نافذة أخرى. حدّث الصفحة قبل الحفظ.'},{status:409});}return Response.json({revision:body.revision+1});
 }catch{return Response.json({error:'لم يتم الحفظ. بيانات الإدخال موجودة؛ حاول مرة أخرى.'},{status:503});}
}
