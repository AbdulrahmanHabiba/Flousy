import {authContext,identity,sameOrigin,readBody,unavailable} from '../../../lib/supabase';
import {resetLedger,validConfirmation} from '../../../../lib/lifecycle';
import {emptyState} from '../../../../lib/money';
export async function POST(r:Request){return manage(r,false);}
export async function DELETE(r:Request){return manage(r,true);}
async function manage(request:Request,deleting:boolean){try{
 const c=await authContext();if(!sameOrigin(request))return c.json({error:'طلب غير مسموح.'},403);const user=await identity(c);if(!user)return c.json({error:'سجّل الدخول أولًا.'},401);
 const body=await readBody(request);if(!validConfirmation(body.confirmation)||!Number.isSafeInteger(body.revision)||body.revision<0)return c.json({error:'اكتب 0000 للتأكيد.'},400);
 const {data:row,error:readError}=await c.supabase.from('flousy_wallets').select('payload,revision').eq('user_id',user.id).maybeSingle();if(readError)throw readError;
 if(Number(row?.revision??0)!==body.revision)return c.json({error:'الدفتر اتغير. أعد تحميله.'},409);
 const next=resetLedger(row?.payload??emptyState);
 const {data,error}=await c.supabase.rpc('flousy_manage_wallet',{p_revision:body.revision,p_delete:deleting,p_payload:next,p_confirmation:body.confirmation});
 if(error){if(error.code==='40001')return c.json({error:'الدفتر اتغير. لم نؤكد العملية.'},409);throw error;}
 // This endpoint deletes app-owned records, not the external Google or Supabase Auth identity.
 return c.json(data);
 }catch{return unavailable();}}
