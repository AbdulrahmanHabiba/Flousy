import {reportStore,deliveryConfig} from './server';
import {cairoDate} from './model';
import {sendReport} from './send';
import type {ReportSettings} from './settings';
// A platform scheduler must invoke this server-side function. No trigger is installed by this module.
export async function runDueReports(now=new Date()){
 const cfg=deliveryConfig();if(!cfg.ready||!cfg.scheduleConnected)return {status:'not_configured',attempted:0};
 const localTime=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 const date=cairoDate(now),db=await reportStore();
 const rows=await db.prepare('SELECT user_id,payload FROM report_settings').all<{user_id:string;payload:string}>();
 let attempted=0,accepted=0,failed=0;
 for(const row of rows.results){const prefs=JSON.parse(row.payload) as ReportSettings;if(!prefs.requested||prefs.time!==localTime)continue;attempted++;try{await sendReport(row.user_id,date);accepted++;}catch{failed++;}}
 return {status:failed?'partial_failure':'complete',attempted,accepted,failed};
}
