const API = 'https://okman-live.okgroup0425.workers.dev';   // index.html CONFIG.LIVE_API와 같아요
const params = new URLSearchParams(location.search);
const TEST = (params.get('match') || '').replace(/[^\w-]/g, '').slice(0, 64);
const MATCH = TEST || (()=>{ const t = new Date(); return new Date(t.getTime() - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); })();
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
$('mid').textContent = TEST ? `테스트 경기 · ${TEST}` : MATCH;

// 입장 QR — 같은 폴더의 index.html (테스트 경기면 ?match= 포함)
const SITE = new URL('index.html' + (TEST ? '?match=' + encodeURIComponent(TEST) : ''), location.href).href;
(function drawQR(){
  try{
    const q = qrcode(0, 'M'); q.addData(SITE); q.make();
    $('qr').innerHTML = q.createSvgTag({ cellSize:8, margin:0, scalable:true });
  }catch(e){ $('qr').innerHTML = `<p class="fallback">${esc(SITE)}</p>`; }
})();

setInterval(()=>{ const d = new Date(); $('clock').textContent = d.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }); }, 1000);

let B = null, shownTotal = 0, autoIdx = 0, autoAt = 0, current = '', winSig = '';
const AUTO_MS = 12000;

// 응원 수 — 부드럽게 올라가요
function animateTotal(to){
  const from = shownTotal, t0 = performance.now(), dur = 1200;
  shownTotal = to;
  const step = now => { const k = Math.min(1, (now - t0) / dur), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    $('cheer-n').textContent = v.toLocaleString('ko-KR'); if(k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function scenes(){
  const list = ['qr', 'cheer'];
  if(B && B.mvp) list.push('mvp');
  if(B && B.winners && B.winners.length) list.push('winners');
  return list;
}
function show(name){
  if(name === current) return;
  current = name;
  document.querySelectorAll('.scene').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
}
function paint(){
  if(!B) return show('qr');
  $('vs').textContent = B.opponent ? `vs ${B.opponent}` : '';
  if(B.total !== shownTotal) animateTotal(B.total || 0);
  $('visitors').textContent = (B.visitors || 0).toLocaleString('ko-KR');
  if(B.mvp){ $('mvp-title').textContent = B.mvp.title || 'MVP'; $('mvp-num').textContent = '#' + B.mvp.num; $('mvp-name').textContent = B.mvp.name || ''; }
  const sig = JSON.stringify(B.winners || []);
  if(sig !== winSig){
    winSig = sig;
    const w = B.winners || [];
    $('wins').className = 'wins' + (w.length > 8 ? ' many' : '');
    $('wins').innerHTML = w.map((n, i) => `<span style="animation-delay:${0.4 + i * 0.35}s">${esc(n)}</span>`).join('');
  }
  $('msg').textContent = (B.board && B.board.message) || '';
  let scene = (B.board && B.board.scene) || 'auto';
  if(scene === 'mvp' && !B.mvp) scene = 'auto';
  if(scene === 'winners' && !(B.winners || []).length) scene = 'auto';
  if(scene === 'message' && !(B.board && B.board.message)) scene = 'auto';
  if(scene !== 'auto') return show(scene);
  const list = scenes();
  if(Date.now() - autoAt > AUTO_MS || !list.includes(current)){ autoAt = Date.now(); show(list[autoIdx++ % list.length]); }
}
async function poll(){
  try{
    const r = await fetch(`${API}/live/${encodeURIComponent(MATCH)}/board`, { cache:'no-store' });
    if(!r.ok) throw new Error(r.status);
    B = await r.json();
    $('dot').className = 'dot'; $('status').textContent = '실시간 연결';
  }catch(e){ $('dot').className = 'dot off'; $('status').textContent = '연결 재시도 중…'; }
  paint();
}
poll();
setInterval(poll, 3000);
setInterval(paint, 1000);
// 전체 화면 — 화면을 한 번 누르면
document.addEventListener('click', ()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>{}); });
