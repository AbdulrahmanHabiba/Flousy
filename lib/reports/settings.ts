export type ReportSettings={email:string;requested:boolean;time:string;timezone:'Africa/Cairo'};
export const reportDefaults:ReportSettings={email:'',requested:false,time:'23:59',timezone:'Africa/Cairo'};
export function validSettings(v:ReportSettings){return v&&typeof v.email==='string'&&v.email.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v.email)&&typeof v.requested==='boolean'&&typeof v.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)&&v.timezone==='Africa/Cairo';}
