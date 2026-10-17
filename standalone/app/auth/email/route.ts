import {appOrigin,authContext,sameOrigin,readBody,unavailable} from '../../../lib/supabase';
export async function POST(request:Request){try{
 const c=await authContext();if(!sameOrigin(request))return c.json({error:'طلب غير مسموح.'},403);
 const body=await readBody(request);const email=typeof body.email==='string'?body.email.trim():'';
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||email.length>254||typeof body.password!=='string'||body.password.length<8||body.password.length>128||!['signin','signup'].includes(body.action))return c.json({error:'راجع البريد وكلمة المرور (8 حروف على الأقل).'},400);
 if(body.action==='signup'){
  const {data,error}=await c.supabase.auth.signUp({email,password:body.password,options:{emailRedirectTo:appOrigin()+'/auth/callback'}});
  if(error)return c.json({error:'تعذر إنشاء الحساب. راجع إعدادات البريد أو حاول لاحقًا.'},400);
  return c.json({signedIn:!!data.session,message:data.session?'تم الدخول.':'لو التسجيل متاح لهذا البريد، راجع رسالة تأكيد الحساب.'});
 }
 const {error}=await c.supabase.auth.signInWithPassword({email,password:body.password});
 if(error)return c.json({error:'تعذر الدخول. راجع بياناتك وتأكيد البريد.'},400);
 return c.json({signedIn:true});
 }catch{return unavailable();}}
