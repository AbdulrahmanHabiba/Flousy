import {fundsOf,type State} from './money';
export const confirmationCode='0000';
export function validConfirmation(v:unknown){return v===confirmationCode;}
export function resetLedger(s:State):State{return {...s,opening:Object.fromEntries(fundsOf(s).map(f=>[f.id,0])),openingDebt:0,entries:[],checks:[],debts:[],imports:[],savingsGoal:0,initialized:false};}
