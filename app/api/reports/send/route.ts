import {getChatGPTUser} from '../../../chatgpt-auth';
import {cairoDate,validDate} from '../../../../lib/reports/model';
import {sendReport} from '../../../../lib/reports/send';
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return Response.json({error:'سجّل الدخول أولًا.'},{status:401});if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});try{const b=await req.json() as {date?:string},date=b.date||cairoDate();if(!validDate(date)||date>cairoDate())return Response.json({error:'راجع تاريخ التقرير.'},{status:400});return Response.json(await sendReport(u.userId,date));}catch(e){return Response.json({error:e instanceof Error?e.message:'تعذر الإرسال.'},{status:503});}}
