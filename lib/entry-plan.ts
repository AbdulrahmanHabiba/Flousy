import {balances,fundsOf,entryImpact,validDebtLinks,type State,type Entry} from './money';
export function entryPlan(state:State,entry:Entry,editingId?:string,coverFrom?:string){
 const entries=state.entries.filter(e=>e.id!==editingId),base={...state,entries},at=balances({...base,entries:entries.filter(e=>e.date<=entry.date)});
 const debit=entry.kind==='expense'?entry.pocket:entry.kind==='transfer'?entry.source:null;
 const deficit=debit?Math.max(0,entry.amount-(at[debit]??0)):0;
 if(deficit){const choices=fundsOf(state).filter(f=>f.id!==debit).sort((a,b)=>(a.id==='spend'?-1:b.id==='spend'?1:a.id==='save'?-1:b.id==='save'?1:0)).map(f=>({...f,available:at[f.id]??0}));
 if(entry.kind!=='expense'||!coverFrom)return {ok:false as const,deficit,choices,debit};
 const source=choices.find(f=>f.id===coverFrom);if(!source||source.available<deficit)return {ok:false as const,deficit,choices,debit};
 const transfer:Entry={id:crypto.randomUUID(),kind:'transfer',pocket:entry.pocket,source:coverFrom,sourceMode:'fund',amount:deficit,date:entry.date,note:'تغطية عجز '+(fundsOf(state).find(f=>f.id===entry.pocket)?.name??''),savingPercent:state.savingPercent};entries.push(transfer);
 }
 entries.push(entry);const next={...state,entries,initialized:true};
 if(!validDebtLinks(next))return {ok:false as const,deficit:0,choices:[],debit:entry.pocket,error:'راجع الدين ومبلغ السداد؛ المبلغ أكبر من المتبقي أو الدين غير متاح.'};
 const violation=budgetViolation(state,next);if(violation)return {ok:false as const,deficit:violation.deficit,choices:[],debit:violation.fund};
 return {ok:true as const,state:next};
}
export function budgetViolation(before:State,after:State){const keys=[...new Set([...fundsOf(before),...fundsOf(after)].map(f=>f.id))],old=[...before.entries].sort((a,b)=>a.date.localeCompare(b.date)),next=[...after.entries].sort((a,b)=>a.date.localeCompare(b.date));const dates=[...new Set([...old,...next].map(e=>e.date))].sort();const a:Record<string,number>={...before.opening},b:Record<string,number>={...after.opening};let i=0,j=0;for(const date of ['',...dates]){while(i<old.length&&old[i].date<=date){for(const k of keys)a[k]=(a[k]??0)+entryImpact(old[i],k);i++;}while(j<next.length&&next[j].date<=date){for(const k of keys)b[k]=(b[k]??0)+entryImpact(next[j],k);j++;}for(const k of keys)if((b[k]??0)<Math.min(0,a[k]??0))return {fund:k,deficit:Math.abs(b[k]),date};}return null;}
export function safeRemoval(state:State,id:string){const next={...state,entries:state.entries.filter(e=>e.id!==id)};return budgetViolation(state,next)?null:next;}
