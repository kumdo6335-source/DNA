import {createHmac,timingSafeEqual,randomBytes,randomUUID} from 'node:crypto';
import {listProjects,saveProject,deleteProject,storageMode} from '../lib/data.mjs';
const localSecret=randomBytes(32).toString('hex');
const categories=['지속가능성','지구환경','인공지능'],skills=['이해','활용','윤리','사고','참여','관점'];
function secret(){if(process.env.VERCEL&&(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32))throw new Error('SESSION_SECRET을 32자 이상으로 설정해주세요.');return process.env.SESSION_SECRET||localSecret;}
const sign=value=>createHmac('sha256',secret()).update(value).digest('base64url');
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export function isEditor(req){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('dna_session='))?.slice(12)||'';const [value,signature]=cookie.split('.');return !!value&&!!signature&&/^\d+$/.test(value)&&Number(value)>Date.now()&&equal(signature,sign(value));}
function cookie(res,value,maxAge){res.setHeader('Set-Cookie',`dna_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.VERCEL?'; Secure':''}`);}
async function body(req){if(req.body){if(typeof req.body==='object')return req.body;return JSON.parse(req.body);}let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw Object.assign(new Error('입력 내용이 너무 길어요.'),{status:413});}try{return JSON.parse(raw||'{}');}catch{throw Object.assign(new Error('잘못된 요청 형식입니다.'),{status:400});}}
export function validateProject(data){
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 if(!categories.includes(data.category))fail('프로젝트 영역을 선택해주세요.');
 if(!Array.isArray(data.competencies)||!data.competencies.length||data.competencies.some(s=>!skills.includes(s)))fail('미래주인공 역량을 한 개 이상 선택해주세요.');
 const p={category:data.category,competencies:[...new Set(data.competencies)]};
 for(const [key,max] of Object.entries({title:100,d:5000,n:5000,a:5000,link:2000})){if(typeof data[key]!=='string'||!data[key].trim()||data[key].trim().length>max)fail('제목, D·N·A 내용, 링크를 길이에 맞게 모두 입력해주세요.');p[key]=data[key].trim();}
 try{const link=new URL(p.link);if(!['https:','http:'].includes(link.protocol))fail('http 또는 https 링크만 등록할 수 있어요.');}catch{fail('올바른 링크 주소를 입력해주세요.');}return p;
}
const attempts=new Map();
export default async function handler(req,res){
 const json=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url,'http://localhost'),route=url.searchParams.get('route')||url.pathname.replace(/^\/api\/?/,'');
  const method=req.method;
  if(!['GET','POST','PUT','DELETE'].includes(method))return json(405,{error:'지원하지 않는 요청입니다.'});
  // Reject cross-site browser writes before checking the session.
  if(method!=='GET'&&req.headers.origin){const origin=new URL(req.headers.origin);const host=req.headers.host;if(origin.host!==host)return json(403,{error:'허용되지 않은 요청입니다.'});}
  if(method==='GET'&&route==='session')return json(200,{editor:isEditor(req)});
  if(method==='POST'&&route==='login'){
   const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];const now=Date.now();const prior=attempts.get(ip);if(prior&&prior.until>now&&prior.count>=10)return json(429,{error:'로그인 시도가 많아요. 10분 뒤 다시 시도해주세요.'});
   const data=await body(req);if(typeof data.password!=='string'||!equal(data.password,process.env.EDITOR_PASSWORD||'dna')){attempts.set(ip,{count:(prior?.until>now?prior.count:0)+1,until:prior?.until>now?prior.until:now+600000});if(attempts.size>5000)for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);return json(401,{error:'비밀번호를 다시 확인해주세요.'});}
   const value=String(now+8*60*60*1000);cookie(res,value+'.'+sign(value),28800);attempts.delete(ip);return json(200,{editor:true});
  }
  if(method==='POST'&&route==='logout'){cookie(res,'',0);return json(200,{editor:false});}
  if(method==='GET'&&route==='projects')return json(200,{projects:await listProjects(),mode:storageMode()});
  const match=route.match(/^projects(?:\/([a-f0-9-]{36}))?$/);
  if(!match)return json(404,{error:'요청한 경로를 찾을 수 없어요.'});
  if(!isEditor(req))return json(401,{error:'편집자 로그인이 필요해요.'});
  if((method==='POST'&&!match[1])||(method==='PUT'&&match[1])){const project=validateProject(await body(req));const now=new Date().toISOString();project.id=match[1]||randomUUID();project.createdAt=now;project.updatedAt=now;return json(method==='POST'?201:200,{project:await saveProject(project,method==='POST')});}
  if(method==='DELETE'&&match[1]){await deleteProject(match[1]);return json(200,{deleted:true});}
  return json(405,{error:'지원하지 않는 요청입니다.'});
 }catch(e){console.error('API error:',e.message);json(e.status||500,{error:e.status?e.message:'서버 설정 또는 저장소 연결을 확인해주세요. 잠시 후 다시 시도해주세요.'});}
}
