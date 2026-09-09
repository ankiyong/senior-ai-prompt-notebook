'use strict';
const main=document.querySelector('main');
const STORE='senior-ai-notebook-v1';
let saved={favorites:[],large:false};
try{const data=JSON.parse(localStorage.getItem(STORE));if(data && Array.isArray(data.favorites)){saved.favorites=data.favorites.filter(x=>typeof x==='string');saved.large=data.large===true;}}catch{/* Private mode or damaged storage: continue in memory. */}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(saved));return true;}catch{return false;}}
function fontState(){document.documentElement.classList.toggle('large',saved.large);document.querySelector('#font-toggle').setAttribute('aria-pressed',String(saved.large));document.querySelector('#font-toggle').textContent=saved.large?'기본 글씨':'큰 글씨';const field=document.querySelector('#manual-text');if(field){field.style.height='auto';field.style.height=field.scrollHeight+'px';}}
document.querySelector('#font-toggle').onclick=()=>{saved.large=!saved.large;persist();fontState();};fontState();
window.addEventListener('resize',()=>{const field=document.querySelector('#manual-text');if(field){field.style.height='auto';field.style.height=field.scrollHeight+'px';}});
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const path=location.hash.slice(1)||'/';
 const parts=path.split('/');
 const week=window.WEEKS.find(w=>String(w.id)===parts[2]);
 const prompt=week?.prompts.find(p=>p.id===parts[3]);
 if(path==='/'){
 main.innerHTML=`<section class="intro"><span class="sample">6주 수업 샘플</span><h1>이번 주, 무엇을<br>배워 볼까요?</h1><p class="muted">주차를 고르면 수업에서 쓸 질문을 볼 수 있어요.<br>마음에 드는 질문은 복사해서 AI에게 물어보세요.</p></section><div id="home-tools"></div><div class="grid">${WEEKS.map(w=>`<a class="card week" href="#/week/${w.id}"><span class="week-number">${w.id}주차 · 샘플</span><h2>${escapeHTML(w.title)}</h2><p class="muted">${escapeHTML(w.description)}</p><span class="open">프롬프트 ${w.prompts.length}개 보기 →</span></a>`).join('')}</div>`;
 }else if(parts[1]==='week' && week && parts.length===3){
 main.innerHTML=`<a class="back" href="#/">← 전체 주차</a><p class="eyebrow">${week.id}주차 · 수업 샘플</p><h1>${escapeHTML(week.title)}</h1><p class="muted">${escapeHTML(week.description)}</p><div class="grid">${week.prompts.map(p=>promptCard(week,p)).join('')}</div>`;
 }else if(parts[1]==='week'&&prompt&&parts.length===4){
 main.innerHTML=`<a class="back" href="#/week/${week.id}">← ${week.id}주차 프롬프트</a><p class="eyebrow">${week.id}주차 · ${escapeHTML(week.title)} · 샘플</p><h1>${escapeHTML(prompt.title)}</h1><p class="muted">${escapeHTML(prompt.hint)}</p><section class="panel"><h2>AI에게 이렇게 물어보세요</h2><p>[대괄호] 안을 내 상황에 맞게 바꿔 주세요.</p><div id="prompt-text" class="prompt-body">${escapeHTML(prompt.text)}</div><div class="actions" id="detail-actions"></div><div id="status" role="status" aria-live="polite"></div><div id="manual" hidden></div></section><p class="muted">사진을 쓸 때는 개인정보가 보이지 않는지 먼저 확인해요. 이 수첩은 AI 답변을 직접 생성하지 않아요.</p>`;
 }else{main.innerHTML='<h1>이 페이지를 찾지 못했어요</h1><p>주소를 확인하거나 전체 주차에서 다시 골라 주세요.</p><a class="button" href="#/">전체 주차 보기</a>';}
 if(path==='/'){
 const tools=document.querySelector('#home-tools');const grid=document.querySelector('.grid');const original=grid.innerHTML;let onlySaved=false;
 tools.innerHTML='<div class="search"><label for="search">전체 프롬프트 검색</label><input id="search" type="search" aria-describedby="search-help"><p id="search-help" class="muted">예: 여행, 가족, 문자</p></div><button id="favorites-filter" aria-pressed="false">즐겨찾기만 보기</button><p class="muted">즐겨찾기는 이 기기의 브라우저에만 저장돼요.</p><p id="result-count" role="status"></p>';
 const input=document.querySelector('#search');const toggle=document.querySelector('#favorites-filter');
 function filter(){const q=input.value.trim().toLocaleLowerCase();toggle.setAttribute('aria-pressed',String(onlySaved));if(!q&&!onlySaved){grid.innerHTML=original;document.querySelector('#result-count').textContent='';return;}
 const matches=WEEKS.flatMap(w=>w.prompts.filter(p=>(!onlySaved||saved.favorites.includes(`${w.id}/${p.id}`))&&`${w.title} ${p.title} ${p.hint} ${p.text}`.toLocaleLowerCase().includes(q)).map(p=>promptCard(w,p)));
 grid.innerHTML=matches.join('');document.querySelector('#result-count').textContent=matches.length?`질문 ${matches.length}개를 찾았어요.`:'찾는 질문이 없어요.';
 }
 input.oninput=filter;toggle.onclick=()=>{onlySaved=!onlySaved;filter();};
 }
 if(prompt && document.querySelector('#detail-actions')){
 const fav=document.createElement('button');const key=`${week.id}/${prompt.id}`;
 function favState(){const active=saved.favorites.includes(key);fav.textContent=active?'즐겨찾기 해제':'즐겨찾기 추가';fav.setAttribute('aria-pressed',String(active));}favState();
 fav.onclick=()=>{saved.favorites=saved.favorites.includes(key)?saved.favorites.filter(k=>k!==key):[...saved.favorites,key];const stored=persist();favState();document.querySelector('#status').textContent=stored?'즐겨찾기를 바꿨어요.':'브라우저 저장이 막혀 있어요. 이 창을 닫기 전까지만 기억해요.';};document.querySelector('#detail-actions').append(fav);
 const copy=document.createElement('button');copy.className='primary';copy.textContent='프롬프트 복사';document.querySelector('#detail-actions').append(copy);
 copy.addEventListener('click',async()=>{
 const status=document.querySelector('#status');const manual=document.querySelector('#manual');
 try{await navigator.clipboard.writeText(prompt.text);if(!status.isConnected)return;status.textContent='복사했어요. AI 대화창에 붙여넣어 주세요.';manual.hidden=true;}
 catch{if(!status.isConnected)return;status.textContent='자동 복사가 안 됐어요. 아래 글을 선택해 직접 복사해 주세요.';manual.hidden=false;manual.innerHTML='<label for="manual-text">직접 복사할 질문</label><textarea id="manual-text" readonly></textarea><div class="actions"><button id="select-text">전체 선택</button></div><p>휴대폰: 글을 길게 눌러 복사 · 컴퓨터: Ctrl+C (Mac은 ⌘C)</p>';const field=document.querySelector('#manual-text');field.value=prompt.text;field.style.height=field.scrollHeight+'px';document.querySelector('#select-text').onclick=()=>{field.focus();field.select();};}
 });
 }
 document.title=(prompt?.title||week?.title||'시니어 AI 프롬프트 수첩')+' | AI 수첩';
 main.focus({preventScroll:true});window.scrollTo(0,0);
}
function promptCard(w,p){return `<a class="card prompt" href="#/week/${w.id}/${p.id}"><span class="eyebrow">${w.id}주차 · ${escapeHTML(w.title)}</span><h2>${escapeHTML(p.title)}</h2><p class="muted">${escapeHTML(p.hint)}</p><span class="open">질문 자세히 보기 →</span></a>`;}
window.addEventListener('hashchange',render);render();
