export type GmailPayload={from:string;to:string[];subject:string;html:string;text:string;attachments:{filename:string;content:string;content_type:string}[]};
const enc=(s:string)=>Buffer.from(s,'utf8').toString('base64');
const wrap=(s:string)=>s.match(/.{1,76}/g)?.join('\r\n')||'';
const header=(s:string)=>{if(/[\r\n]/.test(s))throw Error('Invalid mail header');return s;};
const encodedHeader=(value:string)=>{header(value);const chunks:string[]=[];let part='';for(const ch of value){if(Buffer.byteLength(part+ch,'utf8')>42){chunks.push(`=?UTF-8?B?${enc(part)}?=`);part='';}part+=ch;}if(part)chunks.push(`=?UTF-8?B?${enc(part)}?=`);return chunks.join('\r\n ');};
export function gmailMime(p:GmailPayload,key:string){
 const mix='folousy_mixed_'+key.replace(/[^a-zA-Z0-9]/g,'_'),alt=mix+'_alternative';
 const from=header(p.from),match=from.match(/^(.*?)\s*<([^<>]+)>$/),sender=match?`${encodedHeader(match[1].trim())} <${header(match[2])}>`:from;
 const lines=[`From: ${sender}`,`To: ${p.to.map(header).join(', ')}`,`Subject: ${encodedHeader(p.subject)}`,`MIME-Version: 1.0`,`Content-Type: multipart/mixed; boundary="${mix}"`,'',`--${mix}`,`Content-Type: multipart/alternative; boundary="${alt}"`,'',`--${alt}`,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(enc(p.text)),`--${alt}`,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(enc(p.html)),`--${alt}--`];
 for(const a of p.attachments){const name=header(a.filename);if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Invalid attachment name');lines.push(`--${mix}`,`Content-Type: ${header(a.content_type)}; name="${name}"`,`Content-Disposition: attachment; filename="${name}"`,'Content-Transfer-Encoding: base64','',wrap(a.content));}
 lines.push(`--${mix}--`,'');return Buffer.from(lines.join('\r\n'),'utf8').toString('base64url');
}
export async function gmailAccessToken(cfg:{clientId?:string;clientSecret?:string;refreshToken?:string}){if(!cfg.clientId||!cfg.clientSecret||!cfg.refreshToken)throw Error('اربط حساب Gmail أولًا.');const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:cfg.clientId,client_secret:cfg.clientSecret,refresh_token:cfg.refreshToken,grant_type:'refresh_token'}),signal:AbortSignal.timeout(15000)});const data=await res.json() as {access_token?:string};if(!res.ok||!data.access_token)throw Error('تعذر تجديد اتصال Gmail. راجع ربط الحساب.');return data.access_token;}
