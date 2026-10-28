import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';
import handler,{validateProject} from '../api/index.mjs';
const fixture={category:'지속가능성',title:'검증용 프로젝트',competencies:['이해','활용','참여'],d:'문제 발견',n:'전략 연결',a:'실천과 공유',link:'https://example.com/lesson'};
async function call(route,method='GET',data,cookie,origin){const req=Readable.from(data?[JSON.stringify(data)]:[]);req.url='/api/'+route;req.method=method;req.headers={host:'localhost',...(cookie?{cookie}:{}),...(origin?{origin}:{} )};req.socket={remoteAddress:'test'};const headers={};let response;const res={setHeader(k,v){headers[k]=v;},end(value){response=JSON.parse(value);},statusCode:200};await handler(req,res);return {status:res.statusCode,body:response,headers};}
test('validates competencies, required stages and safe links',()=>{
 assert.deepEqual(validateProject(fixture).competencies,fixture.competencies);
 for(const change of [{competencies:[]},{competencies:['임의역량']},{d:' '},{title:'a'.repeat(101)},{link:'javascript:alert(1)'},{category:'없는영역'}])assert.throws(()=>validateProject({...fixture,...change}));
});
test('authentication and project create/read/update/delete lifecycle',async()=>{
 const old=process.cwd();await mkdir(path.join(old,'tmp'),{recursive:true});const dir=await mkdtemp(path.join(old,'tmp','api-test-'));process.chdir(dir);
 try{
  assert.equal((await call('projects','POST',fixture)).status,401);
  assert.equal((await call('login','POST',{password:'wrong'})).status,401);
  const login=await call('login','POST',{password:'dna'});assert.equal(login.status,200);assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);const cookie=login.headers['Set-Cookie'].split(';')[0];
  assert.equal((await call('session','GET',null,cookie)).body.editor,true);
  assert.equal((await call('session','GET',null,cookie+'tampered')).body.editor,false);
  assert.equal((await call('projects','POST',fixture,cookie,'https://attacker.example')).status,403);
  const created=await call('projects','POST',fixture,cookie);assert.equal(created.status,201);const id=created.body.project.id;
  assert.equal((await call('projects')).body.projects.length,1);
  assert.equal((await call('projects/'+id,'PUT',{...fixture,title:'수정된 제목'},cookie)).status,200);
  assert.equal((await call('projects')).body.projects[0].title,'수정된 제목');
  assert.equal((await call('projects/'+id,'DELETE',null,cookie)).status,200);
  assert.equal((await call('projects')).body.projects.length,0);
  assert.equal((await call('projects/'+id,'PUT',fixture,cookie)).status,404);
  assert.match((await call('logout','POST',{},cookie)).headers['Set-Cookie'],/Max-Age=0/);
 }finally{process.chdir(old);await rm(dir,{recursive:true,force:true});}
});
