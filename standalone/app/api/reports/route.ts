import {authContext,identity,unavailable} from '../../../lib/supabase';
import {emptyState} from '../../../../lib/money';
import {dailyReport,cairoDate,validDate,emailHtml} from '../../../../lib/reports/model';
import {fontBase64} from '../../../../lib/reports/font';
import {reportPdf} from '../../../../lib/reports/pdf';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const c=await authContext(),user=await identity(c);if(!user)return c.json({error:'سجّل الدخول أولًا.'},401);const url=new URL(request.url),date=url.searchParams.get('date')||cairoDate();if(!validDate(date))return c.json({error:'راجع التاريخ.'},400);const {data,error}=await c.supabase.from('flousy_wallets').select('payload').eq('user_id',user.id).maybeSingle();if(error)throw error;const report=dailyReport(data?.payload??emptyState,date);if(url.searchParams.get('format')==='pdf')return new Response(reportPdf(report,fontBase64) as BodyInit,{headers:{...c.headers(),'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Flousy-${date}.pdf"`}});return new Response(emailHtml(report,new URL(request.url).origin),{headers:{...c.headers(),'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'"}});}catch{return unavailable();}}
