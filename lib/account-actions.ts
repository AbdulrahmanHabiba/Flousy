export type AccountStatement={sql:string;args:(string|number)[]};
export function deletePlan(userId:string,revision:number,hasWallet:boolean):AccountStatement[]{
 const guard=hasWallet?'EXISTS(SELECT 1 FROM wallet_state WHERE user_id=? AND revision=?)':'NOT EXISTS(SELECT 1 FROM wallet_state WHERE user_id=?)';
 const args=hasWallet?[userId,userId,revision]:[userId,userId];
 return [{sql:'DELETE FROM report_settings WHERE user_id=? AND '+guard,args},{sql:'DELETE FROM report_deliveries WHERE user_id=? AND '+guard,args},{sql:'DELETE FROM wallet_state WHERE user_id=? AND revision=?',args:[userId,revision]}];
}
export function resetPlan(userId:string,revision:number,payload:string):AccountStatement[]{return [
 {sql:'UPDATE wallet_state SET payload=?,revision=revision+1 WHERE user_id=? AND revision=?',args:[payload,userId,revision]},
 {sql:"UPDATE report_settings SET payload=json_set(payload,'$.requested',json('false')) WHERE user_id=? AND EXISTS(SELECT 1 FROM wallet_state WHERE user_id=? AND revision=? AND payload=?)",args:[userId,userId,revision+1,payload]},
 {sql:"UPDATE report_deliveries SET payload='{}',status='cancelled' WHERE user_id=? AND status!='accepted' AND EXISTS(SELECT 1 FROM wallet_state WHERE user_id=? AND revision=? AND payload=?)",args:[userId,userId,revision+1,payload]}
];}

export function emptyResetPlan(userId:string):AccountStatement[]{return [
 {sql:"UPDATE report_settings SET payload=json_set(payload,'$.requested',json('false')) WHERE user_id=? AND NOT EXISTS(SELECT 1 FROM wallet_state WHERE user_id=?)",args:[userId,userId]},
 {sql:"UPDATE report_deliveries SET payload='{}',status='cancelled' WHERE user_id=? AND status!='accepted' AND NOT EXISTS(SELECT 1 FROM wallet_state WHERE user_id=?)",args:[userId,userId]}
];}
