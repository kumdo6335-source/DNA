const $ = s => document.querySelector(s);
const categories = ['지속가능성', '지구환경', '인공지능'];
const skills = ['이해', '활용', '윤리', '사고', '참여', '관점'];
const skillAssets = {"이해": "understanding", "활용": "application", "윤리": "ethics", "사고": "thinking", "참여": "participation", "관점": "perspective"};
const stageAssets = {d:'discover',n:'network',a:'advance'};
const samples = [
 {id:'sample-1',category:'지속가능성',title:'함께 만드는 지속가능한 우리 도시',competencies:['이해','사고','참여'],d:'우리 동네에서 모두의 행복한 삶을 위해 해결해야 할 문제를 찾아봅니다.',n:'도시의 다양한 자료를 살펴보고, AI·디지털 도구를 활용해 해결 아이디어를 연결합니다.',a:'더 나은 도시를 위한 제안을 만들고 친구들과 나누며 생활 속 실천을 시작합니다.'},
 {id:'sample-2',category:'지속가능성',title:'함께해요, 건강한 생활',competencies:['이해','활용','참여'],d:'몸의 기관과 질병의 관계를 알아보고, 건강한 생활을 위한 질문을 만듭니다.',n:'질병 정보를 탐색하고 데이터를 정리하며 건강 정보를 알릴 방법을 설계합니다.',a:'AI·디지털 건강 박람회에서 홍보물을 공유하고 건강한 생활 습관을 실천합니다.'},
 {id:'sample-3',category:'지속가능성',title:'깨끗하고 안전한 물을 찾아서',competencies:['사고','참여','관점'],d:'우리의 삶에서 물이 왜 중요한지, 안전한 물을 위해 어떤 노력이 필요한지 알아봅니다.',n:'물에 관한 자료와 다양한 지식을 연결해 문제를 해결할 방법을 찾습니다.',a:'깨끗한 물을 지키는 실천 방법을 제안하고 일상에서 함께 행동합니다.'},
 {id:'sample-4',category:'지구환경',title:'우리 동네 하천을 지켜라',competencies:['활용','사고','참여'],d:'가까운 하천의 모습을 관찰하고 수질과 생태계에 관한 질문을 만듭니다.',n:'관찰한 자료를 정리하고 하천 환경을 개선할 방법을 함께 탐색합니다.',a:'하천을 지키는 캠페인을 기획하고 지역사회에 실천을 제안합니다.'},
 {id:'sample-5',category:'인공지능',title:'따뜻한 인(人)공지능',competencies:['이해','윤리','관점'],d:'인공지능이 우리 삶에 미치는 영향을 살펴보고 바른 사용에 대해 질문합니다.',n:'여러 사용 사례를 비교하고 책임감 있게 AI를 사용하는 기준을 만듭니다.',a:'모두에게 도움이 되는 AI 사용 약속을 나누고 생활 속에서 실천합니다.'}
].map(p=>({...p,sample:true,link:''}));
let projects=[], editor=false, active=categories[0], mode='local';
let pendingDelete=null, toastTimer;
const escapeHTML = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = value => {try {const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
async function api(route, options={}) {
 const response=await fetch('/api/'+route,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 let data;try {data=await response.json();}catch {throw new Error('서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');}
 if (!response.ok) {if(response.status===401){editor=false;updateEditor();}throw new Error(data.error||'요청을 처리하지 못했어요.');}return data;
}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
function updateEditor(){ $('#login-open').hidden=editor;$('#logout').hidden=!editor;$('#add-project').hidden=!editor;render(); }
function render(){
 categories.forEach((c,i)=>$('#count-'+i).textContent=projects.filter(p=>p.category===c).length);
 const term=$('#search').value.trim().toLocaleLowerCase();
 const visible=projects.filter(p=>p.category===active&&p.title.toLocaleLowerCase().includes(term));
 $('#active-name').textContent=active;$('#result-count').textContent=visible.length+'개의 프로젝트';
 $('#projects').innerHTML=visible.length?visible.map((p,i)=>{
  const stages=[['d','D','발견','Discover'],['n','N','연결','Network'],['a','A','전진','Advance']];
  const link=safeURL(p.link);
  return `<article class="project-card"><div class="card-top"><div class="card-number">PROJECT ${String(i+1).padStart(2,'0')}${p.sample?'<span class="example-badge">구성 예시</span>':''}</div><h3>${escapeHTML(p.title)}</h3><div class="tags">${p.competencies.map(s=>`<span class="tag image-tag"><img src="/assets/labels/${skillAssets[s]}.png" alt="${escapeHTML(s)}" title="${escapeHTML(s)}"></span>`).join('')}</div></div><div class="stages">${stages.map(([key,letter,label,en])=>`<div class="stage"><div class="stage-content"><h4><img class="stage-label" src="/assets/labels/${stageAssets[key]}.png" alt="${letter} ${label} · ${en}"></h4><p>${escapeHTML(p[key])}</p></div></div>`).join('')}</div><div class="card-footer">${link?`<a class="detail-link" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">자세히 알아보기 <span>↗</span></a>`:p.sample?'<div class="detail-link muted">프로젝트 구성 예시입니다 <span>✦</span></div>':''}${editor&&!p.sample?`<div class="card-actions"><button data-edit="${escapeHTML(p.id)}">수정하기</button><button data-delete="${escapeHTML(p.id)}">삭제하기</button></div>`:''}</div></article>`;
 }).join(''):`<div class="empty"><strong>${term?'검색 결과가 없어요.':'첫 번째 이야기를 기다리고 있어요.'}</strong><br>${term?'다른 제목으로 검색해보세요.':'편집자로 로그인하고 이 영역의 프로젝트를 올려주세요.'}</div>`;
}
async function load(){
 try {const [data,session]=await Promise.all([api('projects'),api('session')]);mode=data.mode;projects=data.projects.length?data.projects:(mode==='local'?samples:[]);editor=session.editor;
 $('#storage-notice').hidden=mode!=='local';$('#storage-notice').textContent='로컬 미리보기 · 최초 등록 전에는 구성 예시가 보입니다. 등록한 내용은 이 컴퓨터에 저장되며, Firebase 연결 후에는 모두에게 공유됩니다.';
 updateEditor();}catch(e){$('#projects').innerHTML='<div class="empty">프로젝트를 불러오지 못했어요.<br><button class="button" id="retry">다시 불러오기</button></div>';toast(e.message);$('#retry').onclick=load;}
}
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>{const chosen=b===button;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(chosen));});render();}));
$('#search').addEventListener('input',render);
$('#login-open').onclick=()=>{$('#login-form').reset();$('#login-form .form-error').textContent='';$('#login-dialog').showModal();};
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
$('#login-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');button.disabled=true;try{await api('login',{method:'POST',body:JSON.stringify({password:form.password.value})});editor=true;updateEditor();$('#login-dialog').close();form.reset();toast('편집자 모드가 시작되었어요.');}catch(e){form.querySelector('.form-error').textContent=e.message;}finally{button.disabled=false;}};
$('#logout').onclick=async()=>{try{await api('logout',{method:'POST',body:'{}'});editor=false;updateEditor();toast('편집자 모드를 종료했어요.');}catch(e){toast(e.message);}};
$('#competency-options').innerHTML=skills.map(s=>`<label><input type="checkbox" name="competencies" value="${s}" aria-label="${s}"><span class="skill-choice"><img src="/assets/labels/${skillAssets[s]}.png" alt="${s}"><i aria-hidden="true">✓</i></span></label>`).join('');
function openEditor(project){const form=$('#editor-form');form.reset();form.querySelector('.form-error').textContent='';form.elements.id.value=project?.id||'';form.elements.category.value=project?.category||active;['title','d','n','a','link'].forEach(key=>form.elements[key].value=project?.[key]||'');form.querySelectorAll('[name=competencies]').forEach(c=>c.checked=project?.competencies.includes(c.value)||false);$('#editor-title').textContent=project?'프로젝트 수정하기':'프로젝트 올리기';$('#editor-dialog').showModal();}
$('#add-project').onclick=()=>openEditor();
$('#projects').onclick=event=>{const edit=event.target.closest('[data-edit]'),del=event.target.closest('[data-delete]');if(edit)openEditor(projects.find(p=>p.id===edit.dataset.edit));if(del){pendingDelete=del.dataset.delete;$('#delete-dialog').returnValue='cancel';$('#delete-title').textContent=projects.find(p=>p.id===pendingDelete).title;$('#delete-dialog').showModal();}};
$('#editor-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));data.competencies=new FormData(form).getAll('competencies');const error=form.querySelector('.form-error');if(!data.competencies.length){error.textContent='미래주인공 역량을 한 개 이상 선택해주세요.';return;}if(!safeURL(data.link)){error.textContent='http:// 또는 https://로 시작하는 링크를 입력해주세요.';return;}const button=form.querySelector('[type=submit]');button.disabled=true;error.textContent='';try{await api('projects'+(data.id?'/'+encodeURIComponent(data.id):''),{method:data.id?'PUT':'POST',body:JSON.stringify(data)});active=data.category;document.querySelector(`[data-category="${active}"]`).click();$('#search').value='';await load();$('#editor-dialog').close();toast('프로젝트를 저장했어요.');}catch(e){error.textContent=e.message;}finally{button.disabled=false;}};
$('#delete-dialog').addEventListener('close',async()=>{if($('#delete-dialog').returnValue!=='delete'||!pendingDelete)return;try{await api('projects/'+encodeURIComponent(pendingDelete),{method:'DELETE'});await load();toast('프로젝트를 삭제했어요.');}catch(e){toast(e.message);}finally{pendingDelete=null;}});
load();
