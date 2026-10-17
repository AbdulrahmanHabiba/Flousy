import {appOrigin,authContext} from '../../../lib/supabase';
export const dynamic='force-dynamic';
export async function GET(){
 const c=await authContext();
 try{
  const settings=await fetch(process.env.SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY!},cache:'no-store',signal:AbortSignal.timeout(10000)});
  const configured=await settings.json() as {external?:{google?:boolean}};
  if(!settings.ok||!configured.external?.google)return c.redirect('/login?auth_error=google_setup');
  const {data,error}=await c.supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:appOrigin()+'/auth/callback',skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
  if(error||!data.url)return c.redirect('/login?auth_error=google_setup');
  return c.redirect(data.url);
 }catch{return c.redirect('/login?auth_error=unavailable');}
}
