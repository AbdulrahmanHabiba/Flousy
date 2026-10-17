import {authContext,identity,sameOrigin,readBody,unavailable} from '../../../lib/supabase';
import {emptyState,validState,type State} from '../../../../lib/money';
import {budgetViolation} from '../../../../lib/entry-plan';
export const dynamic='force-dynamic';
export async function GET(){try{
 const c=await authContext(),user=await identity(c);if(!user)return c.json({error:'سجّل الدخول لحفظ بياناتك.'},401);
 const {data,error}=await c.supabase.from('flousy_wallets').select('payload,revision').eq('user_id',user.id).maybeSingle();if(error)throw error;
 return c.json({state:data?.payload??emptyState,revision:Number(data?.revision??0),user:{id:'supabase:'+user.id,name:user.user_metadata?.full_name||user.email?.split('@')[0]||'حسابي',email:user.email??''}});
 }catch{return unavailable();}}
export async function POST(request:Request){try{
 const c=await authContext();if(!sameOrigin(request))return c.json({error:'طلب غير مسموح.'},403);const user=await identity(c);if(!user)return c.json({error:'سجّل الدخول أولًا.'},401);
 const body=await readBody(request) as {state:State;revision:number};if(!validState(body.state)||!Number.isSafeInteger(body.revision)||body.revision<0)return c.json({error:'راجع المبالغ والتواريخ.'},400);
 const {data:existing,error:readError}=await c.supabase.from('flousy_wallets').select('payload,revision').eq('user_id',user.id).maybeSingle();if(readError)throw readError;
 if(Number(existing?.revision??0)===body.revision&&budgetViolation(existing?.payload??emptyState,body.state))return c.json({error:'الرصيد لا يكفي. غطّ الفرق من صندوق آخر أولًا.'},400);
 // The RPC compares jsonb semantically for exact ambiguous retries, independent of key order.
 const {data,error}=await c.supabase.rpc('flousy_save_wallet',{p_revision:body.revision,p_payload:body.state});
 if(error){if(error.code==='40001')return c.json({error:'الدفتر اتغير في نافذة أخرى. راجع التغييرات المحلية.'},409);throw error;}
 return c.json(data);
 }catch{return unavailable();}}
