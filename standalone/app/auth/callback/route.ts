import {authContext} from '../../../lib/supabase';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const c=await authContext(),url=new URL(request.url),code=url.searchParams.get('code');
 if(!code||url.searchParams.has('error'))return c.redirect('/login?auth_error=callback');
 const {error}=await c.supabase.auth.exchangeCodeForSession(code);
 if(error)return c.redirect('/login?auth_error=callback');
 return c.redirect('/?mode=cloud');
}
