import {validState,type State} from './money';
export type SyncStatus='saved'|'pending'|'saving'|'conflict'|'error';
type Flight={state:State;version:number;revision:number};
type RecordData={owner?:string;base:State;local:State;revision:number;version:number;accepted:number;flight?:Flight};
type StorageLike={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
type Transport=(state:State,revision:number)=>Promise<{revision:number}>;
const same=(a:State,b:State)=>JSON.stringify(a)===JSON.stringify(b);
export class SyncQueue{
 private writer=crypto.randomUUID();private record:RecordData;private running:Promise<boolean>|null=null;private timer:ReturnType<typeof setTimeout>|null=null;private blocked=false;private disposed=false;
 constructor(private key:string,server:State,revision:number,private storage:StorageLike,private transport:Transport,private status:(s:SyncStatus)=>void,private ack:(revision:number)=>void){
 const raw=storage.getItem(key);this.record={base:server,local:server,revision,version:0,accepted:0};
 if(raw){const old=JSON.parse(raw) as RecordData;if(!validState(old.local)||!validState(old.base)||!Number.isSafeInteger(old.version)||!Number.isSafeInteger(old.accepted)||!Number.isSafeInteger(old.revision)||old.revision<0||old.accepted<0||old.version<old.accepted||old.flight&&(!validState(old.flight.state)||!Number.isSafeInteger(old.flight.version)||old.flight.version>old.version||!Number.isSafeInteger(old.flight.revision)))throw Error('التغييرات المحلية تحتاج مراجعة؛ لم نمسحها.');
 if(old.version>old.accepted){this.record=old;if(revision===old.revision&&same(server,old.base)){}else if(old.flight&&same(server,old.flight.state)){this.record.base=server;this.record.revision=revision;this.record.accepted=old.flight.version;delete this.record.flight;}else if(same(server,old.local)){this.record.base=server;this.record.revision=revision;this.record.accepted=old.version;delete this.record.flight;}else{this.blocked=true;status('conflict');}}}
 this.persist(true);if(!this.blocked)status(this.pending?'pending':'saved');
 }
 get state(){return this.record.local;}get revision(){return this.record.revision;}get pending(){return this.record.version>this.record.accepted;}get conflicted(){return this.blocked;}
 private persist(claim=false){const raw=this.storage.getItem(this.key);if(!claim&&raw){const data=JSON.parse(raw) as RecordData;if(data.owner&&data.owner!==this.writer)throw Object.assign(Error('نافذة أخرى أصبحت مسؤولة عن الدفتر.'),{status:409});}this.record.owner=this.writer;this.storage.setItem(this.key,JSON.stringify(this.record));}
 enqueue(state:State){if(this.disposed)throw Error('الحساب غير متاح للحفظ.');if(!validState(state))throw Error('راجع بيانات الدفتر.');const raw=this.storage.getItem(this.key);if(raw){const current=JSON.parse(raw) as RecordData;if(current.owner&&current.owner!==this.writer||current.version>this.record.version)throw Error('الدفتر اتغير في نافذة أخرى. حدّثها قبل الإضافة.');}
 const next={...this.record,local:state,version:this.record.version+1};this.storage.setItem(this.key,JSON.stringify(next));this.record=next;this.status(this.blocked?'conflict':'pending');if(!this.blocked)this.schedule();}
 private schedule(){if(this.timer)clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;void this.flush();},400);}
 flush():Promise<boolean>{if(this.disposed||this.blocked)return Promise.resolve(false);if(this.running)return this.running;this.running=this.run().finally(()=>{this.running=null;});return this.running;}
 private async run(){try{while(this.pending&&!this.disposed){const flight=this.record.flight??{state:this.record.local,version:this.record.version,revision:this.record.revision};this.record.flight=flight;this.persist();this.status('saving');const response=await this.transport(flight.state,flight.revision);if(this.disposed)return false;
 this.record.base=flight.state;this.record.revision=response.revision;this.record.accepted=flight.version;delete this.record.flight;this.persist();this.ack(response.revision);}
 this.status('saved');return true;}catch(e){if(this.disposed)return false;const status=(e as {status?:number}).status;if(status===409||status===401){this.blocked=true;this.status('conflict');}else{this.status('error');if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;void this.flush();},10000);}return false;}}
 discard(){const raw=this.storage.getItem(this.key);if(raw&&JSON.parse(raw).owner!==this.writer)throw Error('الدفتر مفتوح في نافذة أخرى. استخدم النافذة الأحدث أولًا.');this.dispose(true);}
 dispose(clear=false){this.disposed=true;if(this.timer)clearTimeout(this.timer);if(clear){const raw=this.storage.getItem(this.key);if(!raw||JSON.parse(raw).owner===this.writer)this.storage.removeItem(this.key);}}
}
