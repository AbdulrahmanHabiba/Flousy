export const themes=[
{id:'ink',name:'حبر أزرق · فاتح',background:'#F1F5FF',primary:'#17264A',accent:'#2563EB',surface:'#FFFFFF',muted:'#5D6C88',mode:'light',radius:'18px',page:'radial-gradient(ellipse at top right,#C9DEFF80,transparent 60%)',shadow:'0 8px 28px #2740780a'},
{id:'cream',name:'ورق دافئ · فاتح',background:'#FFF4E5',primary:'#422D21',accent:'#B55028',surface:'#FFFDFA',muted:'#806B59',mode:'light',radius:'10px',page:'linear-gradient(150deg,#FFF9EC,#F5E6D1)',shadow:'3px 4px 0 #DBC8B840'},
{id:'dark',name:'فحم ومرجان · داكن',background:'#121217',primary:'#F4EDEB',accent:'#FF7969',surface:'#22212A',muted:'#B9ADB6',mode:'dark',radius:'20px',page:'radial-gradient(ellipse at top right,#65303C55,transparent 65%)',shadow:'0 12px 36px #00000028'},
{id:'midnight',name:'منتصف الليل · داكن',background:'#061C27',primary:'#D9F6F2',accent:'#54DED0',surface:'#10313D',muted:'#94B8BD',mode:'dark',radius:'12px',page:'radial-gradient(ellipse at bottom left,#087D7850,transparent 60%)',shadow:'0 0 25px #46DCC512'}
];
const legacy:Record<string,string>={navy:'ink',white:'ink',forest:'cream',tomato:'cream',slate:'ink'};
export function themeOf(id?:string){return themes.find(t=>t.id===(legacy[id||'']||id))??themes[0];}
