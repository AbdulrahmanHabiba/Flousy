import {entryCategory,kindLabels} from '../money';
import {jsPDF} from 'jspdf';
import {amount,type Report} from './model';
import {boldFontBase64,interFontBase64} from './font';
export function reportPdf(r:Report,fontBase64:string){
 const pockets=r.pockets;
 const d=new jsPDF({unit:'mm',format:'a4'});d.addFileToVFS('Plex-Regular.ttf',fontBase64);d.addFont('Plex-Regular.ttf','Arabic','normal');d.addFileToVFS('Plex-SemiBold.ttf',boldFontBase64);d.addFont('Plex-SemiBold.ttf','Arabic','bold');d.addFileToVFS('Inter-Regular.ttf',interFontBase64);d.addFont('Inter-Regular.ttf','Inter','normal');d.setFont('Arabic');
 let y=0,page=0;
 const ar=(s:string,x:number,yy:number,size=10)=>{d.setFont('Arabic',size>=12?'bold':'normal');d.setFontSize(size);d.text(s,x,yy,{align:'right'});};
 const num=(s:string,x:number,yy:number,size=10)=>{d.setFont('Inter','normal');d.setFontSize(size);d.text(s,x,yy,{align:'right'});};
 function header(){page++;d.setFillColor('#17243a');d.rect(0,0,210,31,'F');d.setTextColor('#ffffff');ar('فلوسي | التقرير اليومي',196,15,18);num(r.date,196,24,10);d.setTextColor('#17243a');y=43;}
 function footer(){d.setTextColor('#778398');ar('الأرصدة حسب الحركات المسجلة حتى إعداد التقرير · بتوقيت القاهرة',196,284,8);num(String(page),16,284,8);d.setTextColor('#17243a');}
 function ensure(h:number){if(y+h>272){footer();d.addPage();header();}}
 header();ar('أُعدّ: '+r.stamp,196,y,8);y+=10;ar('دخل اليوم',196,y,10);ar('إجمالي الخارج',130,y,10);ar('إجمالي المتبقي',64,y,10);y+=10;num(amount(r.income),196,y,16);num(amount(r.spent),130,y,16);num(amount(r.closing.total),64,y,16);y+=16;
 ar('أرصدة الصناديق · جميع المبالغ بالجنيه المصري',196,y,12);y+=9;
 const cols=[196,150,112,76,40];
 function tableHeader(){d.setFillColor('#eef2f7');d.rect(14,y-6,182,10,'F');['الصندوق','بداية اليوم','وارد','خارج','المتبقي'].forEach((t,i)=>ar(t,cols[i],y,9));y+=12;}
 tableHeader();for(const p of pockets){if(y+14>265){ensure(30);tableHeader();}ar(r.names[p],196,y,10);[r.opening[p],r.inflow[p],r.outflow[p],r.closing[p]].forEach((n,i)=>num(amount(n),cols[i+1],y,9));d.setDrawColor('#e4e8ee');d.line(14,y+4,196,y+4);y+=14;}
 ensure(34);y+=7;ar('صدقات خارج أموالي: '+amount(r.external)+' ج.م · منفصلة عن الأرصدة',196,y,9);y+=9;ar('تفاصيل حركات اليوم',196,y,12);y+=10;
 if(!r.rows.length){ar('لا توجد حركات مسجلة في هذا اليوم.',196,y,10);y+=12;}
 for(const e of r.rows){d.setFont('Arabic','normal');d.setFontSize(10);const lines=d.splitTextToSize(e.note||'بدون وصف',115) as string[];const h=Math.max(18,lines.length*6+9);ensure(h);d.setFillColor('#f7f9fc');d.rect(14,y-5,182,h-2,'F');lines.forEach((l,i)=>ar(l,192,y+i*6,10));num(amount(e.amount),69,y,10);ar(kindLabels[e.kind]+' · '+entryCategory(e,r.names),192,y+lines.length*6,8);y+=h;}
 ensure(r.check?20:12);y+=5;ar(r.check?'تم تسجيل مراجعة فعلية للرصيد في هذا اليوم.':'لم تسجل مراجعة فعلية للرصيد اليوم.',196,y,9);if(r.check){y+=8;ar('فرق المراجعة: '+amount(pockets.reduce((n,p)=>n+(r.check!.actual[p]??0)-(r.check!.expected[p]??0),0))+' ج.م',196,y,9);}
 footer();return new Uint8Array(d.output('arraybuffer'));
}
