'use strict';
const main = document.querySelector('main');
const STORE = 'senior-ai-notebook-v1';
let large = false;
try { large = JSON.parse(localStorage.getItem(STORE))?.large === true; } catch { /* Continue in memory. */ }
function persistFont() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE));
    const prior = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    localStorage.setItem(STORE, JSON.stringify({...prior, large}));
  } catch { /* Storage may be blocked; the control still works. */ }
}
function fitManual() {
  const field = document.querySelector('#manual-text');
  if (field) { field.style.height = 'auto'; field.style.height = field.scrollHeight + 'px'; }
}
function fontState() {
  document.documentElement.classList.toggle('large', large);
  const button = document.querySelector('#font-toggle');
  button.setAttribute('aria-pressed', String(large));
  button.textContent = large ? '기본 글씨' : '큰 글씨';
  fitManual();
}
document.querySelector('#font-toggle').onclick = () => { large = !large; persistFont(); fontState(); };
fontState();
window.addEventListener('resize', fitManual);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function promptCard(topic, prompt) {
  return `<a class="card prompt" href="#/topic/${topic.id}/${prompt.id}"><span class="eyebrow">연습 예시</span><h2>${escapeHTML(prompt.title)}</h2><p class="muted">${escapeHTML(prompt.hint)}</p><span class="open">프롬프트 자세히 보기 →</span></a>`;
}
function render() {
  let path = location.hash.slice(1) || '/';
  const parts = path.split('/');
  let topic = parts[1] === 'topic' ? window.TOPICS.find(t => t.id === parts[2]) : null;
  let prompt = topic?.prompts.find(p => p.id === parts[3]);
  if (path !== '/' && !(topic && (parts.length === 3 || (parts.length === 4 && prompt)))) {
    // Old or unknown addresses safely return to the topic home.
    history.replaceState(null, '', location.pathname + location.search + '#/');
    path = '/'; topic = null; prompt = null;
  }
  if (path === '/') {
    main.innerHTML = `<section class="intro"><span class="sample">프롬프트 연습 수첩</span><h1>주제 목록</h1><p class="muted">주제를 고르고, 필요한 프롬프트를 복사해 보세요.</p></section><div id="home-tools"><div class="search"><label for="search">프롬프트 검색</label><input id="search" type="search" aria-describedby="search-help"><p id="search-help" class="muted">예: 시작, 결과물, 부탁</p></div><p id="result-count" role="status"></p></div><div class="grid">${window.TOPICS.map(t => `<a class="card topic" href="#/topic/${t.id}"><h2>${escapeHTML(t.title)}</h2><p class="muted">${escapeHTML(t.description)}</p><span class="open">프롬프트 ${t.prompts.length}개 보기 →</span></a>`).join('')}</div>`;
    const grid = document.querySelector('.grid');
    const original = grid.innerHTML;
    document.querySelector('#search').oninput = event => {
      const query = event.target.value.trim().toLocaleLowerCase();
      if (!query) { grid.innerHTML = original; document.querySelector('#result-count').textContent = ''; return; }
      const matches = window.TOPICS.flatMap(t => t.prompts.filter(p => `${t.title} ${p.title} ${p.hint} ${p.text}`.toLocaleLowerCase().includes(query)).map(p => promptCard(t, p)));
      grid.innerHTML = matches.join('');
      document.querySelector('#result-count').textContent = matches.length ? `프롬프트 ${matches.length}개를 찾았어요.` : '찾는 프롬프트가 없어요.';
    };
  } else if (!prompt) {
    main.innerHTML = `<a class="back" href="#/">← 주제 목록</a><h1>${escapeHTML(topic.title)}</h1><p class="muted">${escapeHTML(topic.description)}</p><p class="sample">연습 예시 · 실제 강의 본문은 아니에요.</p><div class="grid">${topic.prompts.map(p => promptCard(topic, p)).join('')}</div>`;
  } else {
    main.innerHTML = `<a class="back" href="#/topic/${topic.id}">← 프롬프트 목록</a><p class="eyebrow">${escapeHTML(topic.title)} · 연습 예시</p><h1>${escapeHTML(prompt.title)}</h1><p class="muted">${escapeHTML(prompt.hint)}</p><section class="panel"><h2>AI에게 이렇게 부탁하세요</h2><p>고치거나 빈칸을 채울 필요 없이 그대로 복사하세요.</p><p>AI가 물으면 번호나 짧은 말로 답해요. "모르겠어요"도 괜찮아요. "질문 그만" 또는 "이제 만들어줘"라고 하면 질문을 멈추고 결과물을 만들도록 부탁하는 글이에요.</p><div id="prompt-text" class="prompt-body">${escapeHTML(prompt.text)}</div><div class="actions"><button id="copy" class="primary">프롬프트 복사</button></div><div id="status" role="status" aria-live="polite"></div><div id="manual" hidden></div></section><p class="muted">AI 대화창에 붙여넣고 답해 보세요. 이 수첩은 AI와의 대화를 자동으로 진행하거나 답변을 직접 만들지 않아요. AI마다 지시를 따르는 정도가 달라요. 답은 한 번 더 확인해요.</p>`;
    document.querySelector('#copy').onclick = async () => {
      const status = document.querySelector('#status');
      const manual = document.querySelector('#manual');
      try {
        await navigator.clipboard.writeText(prompt.text);
        if (!status.isConnected) return;
        status.textContent = '복사했어요. AI 대화창에 붙여넣어 주세요.';
        manual.hidden = true;
      } catch {
        if (!status.isConnected) return;
        status.textContent = '자동 복사가 안 됐어요. 아래 글을 선택해 직접 복사해 주세요.';
        manual.hidden = false;
        manual.innerHTML = '<label for="manual-text">직접 복사할 프롬프트</label><textarea id="manual-text" readonly></textarea><div class="actions"><button id="select-text">전체 선택</button></div><p>휴대폰: 글을 길게 눌러 복사 · 컴퓨터: Ctrl+C (Mac은 ⌘C)</p>';
        const field = document.querySelector('#manual-text');
        field.value = prompt.text;
        fitManual();
        document.querySelector('#select-text').onclick = () => { field.focus(); field.select(); };
      }
    };
  }
  document.title = (prompt?.title || topic?.title || '시니어 AI 프롬프트 수첩') + ' | AI 수첩';
  main.focus({preventScroll:true}); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
render();
