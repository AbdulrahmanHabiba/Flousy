import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';

export function appOrigin(){
 const value=process.env.APP_ORIGIN;
 if(!value)throw Error('APP_ORIGIN is not configured');
 const url=new URL(value);
 if(url.origin!==value||!(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('Invalid APP_ORIGIN');
 return value;
}
export function sameOrigin(request:Request){return request.headers.get('origin')===appOrigin();}
export async function readBody(request:Request){
 const raw=await request.text();
 if(new TextEncoder().encode(raw).byteLength>8*1024*1024)throw Error('Payload exceeds limit');
 return JSON.parse(raw);
}
export async function authContext(){
 const store=await cookies(),url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw Error('Supabase is not configured');
 const cacheHeaders:Record<string,string>={};
 const supabase=createServerClient(url,key,{cookieOptions:{httpOnly:true,secure:appOrigin().startsWith('https:'),sameSite:'lax',path:'/'},cookies:{
  getAll:()=>store.getAll(),
  setAll(items,headers){for(const cookie of items)store.set(cookie.name,cookie.value,cookie.options);Object.assign(cacheHeaders,headers);}
 }});
 const headers=()=>({'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache',...cacheHeaders});
 return {supabase,headers,json:(data:unknown,status=200)=>NextResponse.json(data,{status,headers:headers()}),redirect:(path:string)=>NextResponse.redirect(new URL(path,appOrigin()),{status:303,headers:headers()})};
}
export async function identity(context:Awaited<ReturnType<typeof authContext>>){
 // Always validate with Auth; cookie contents or editable metadata never authorize access.
 const {data,error}=await context.supabase.auth.getUser();
 return error?null:data.user;
}
export function unavailable(){return NextResponse.json({error:'الخدمة محتاجة مراجعة إعدادات الاتصال. بياناتك المحلية محفوظة.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
