import {createSign} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
export function storageMode(){
 const keys=['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'];
 if(keys.every(k=>process.env[k]))return 'firebase';
 if(process.env.VERCEL||keys.some(k=>process.env[k]))throw new Error('Firebase 환경 변수를 모두 설정해주세요.');
 return 'local';
}
let tokenCache=null;
async function accessToken(){
 if(tokenCache&&tokenCache.expires>Date.now()+60000)return tokenCache.value;
 const now=Math.floor(Date.now()/1000),encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:process.env.FIREBASE_CLIENT_EMAIL,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const signer=createSign('RSA-SHA256');signer.update(unsigned);signer.end();
 const assertion=unsigned+'.'+signer.sign(process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n'),'base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Firebase 인증 설정을 확인해주세요.');
 const data=await response.json();tokenCache={value:data.access_token,expires:Date.now()+data.expires_in*1000};return data.access_token;
}
function encodeFields(project){return Object.fromEntries(Object.entries(project).filter(([key])=>key!=='id').map(([key,value])=>[key,Array.isArray(value)?{arrayValue:{values:value.map(s=>({stringValue:s}))}}:{stringValue:value}]));}
function decodeDocument(document){const p={id:document.name.split('/').at(-1)};for(const [k,v] of Object.entries(document.fields||{}))p[k]=v.arrayValue?(v.arrayValue.values||[]).map(x=>x.stringValue):v.stringValue;return p;}
async function firestore(suffix='',options={}){
 const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(process.env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/projects${suffix}`;
 const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+await accessToken(),'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});
 if(!response.ok){if(response.status===404&&suffix.includes('/')&&!suffix.includes('?'))throw Object.assign(new Error('프로젝트를 찾을 수 없어요.'),{status:404});throw new Error('Firebase 저장소 요청이 실패했어요. 프로젝트 설정과 서비스 계정 권한을 확인해주세요.');}
 return response.status===204?{}:response.json();
}
const localFile=path.resolve('.data/projects.json');
async function localRead(){try{return JSON.parse(await readFile(localFile,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
let writeQueue=Promise.resolve();
function localUpdate(callback){const operation=writeQueue.then(async()=>{const projects=await localRead();const result=callback(projects);await mkdir(path.dirname(localFile),{recursive:true});await writeFile(localFile+'.tmp',JSON.stringify(projects,null,2),'utf8');await rename(localFile+'.tmp',localFile);return result;});writeQueue=operation.catch(()=>{});return operation;}
export async function listProjects(){if(storageMode()==='local')return localRead();let projects=[],pageToken='';do{const data=await firestore('?pageSize=300'+(pageToken?'&pageToken='+encodeURIComponent(pageToken):''));projects.push(...(data.documents||[]).map(decodeDocument));pageToken=data.nextPageToken||'';}while(pageToken);return projects.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export async function saveProject(project,isNew){
 if(storageMode()==='local')return localUpdate(projects=>{const i=projects.findIndex(p=>p.id===project.id);if(!isNew&&i<0)throw Object.assign(new Error('프로젝트를 찾을 수 없어요.'),{status:404});if(i>=0){project.createdAt=projects[i].createdAt;projects[i]=project;}else projects.unshift(project);return project;});
 const suffix=isNew?'?documentId='+project.id:'/'+project.id+'?'+Object.keys(encodeFields(project)).filter(k=>k!=='createdAt').map(k=>'updateMask.fieldPaths='+k).join('&')+'&currentDocument.exists=true';
 return decodeDocument(await firestore(suffix,{method:isNew?'POST':'PATCH',body:JSON.stringify({fields:encodeFields(project)})}));
}
export async function deleteProject(id){if(storageMode()==='local')return localUpdate(projects=>{const i=projects.findIndex(p=>p.id===id);if(i<0)throw Object.assign(new Error('프로젝트를 찾을 수 없어요.'),{status:404});projects.splice(i,1);});await firestore('/'+id,{method:'DELETE'});}
