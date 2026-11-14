/* ================= 界面与交互 ================= */
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

/* ---------- 安全存储 ---------- */
const LS = (() => {
  try { localStorage.setItem('__p__', '1'); localStorage.removeItem('__p__'); return localStorage; }
  catch (e) {
    const m = {};
    return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
  }
})();
window.LS = LS;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600);
}

/* ---------- 主题 ---------- */
const THEMES = [
  { id:'ink',  name:'墨', band:'linear-gradient(135deg,#0e1210 30%,#1b231e 60%,#c8a84b)', tc:'#e5cd82',
    tip:'墨：夜色铜金，最耐看' },
  { id:'zhu',  name:'朱', band:'linear-gradient(135deg,#17100f 30%,#291b18 60%,#c66a4a)', tc:'#eda180',
    tip:'朱：朱砂赤金，气象自重' },
  { id:'qing', name:'竹', band:'linear-gradient(135deg,#0c1512 30%,#18251f 60%,#6fa98c)', tc:'#aad6bd',
    tip:'竹：竹青石绿，清而静' },
  { id:'xuan', name:'宣', band:'linear-gradient(135deg,#f3ece0 30%,#f6f0e4 60%,#a8402f)', tc:'#a8402f',
    tip:'宣：宣纸米白，日间护眼' },
  { id:'ye',   name:'夜', band:'linear-gradient(135deg,#0c111a 30%,#19212f 60%,#8fa8cf)', tc:'#c6d8f2',
    tip:'夜：靛蓝月白，沉而远' }
];
const BGMAP = { ink:'#0e1210', zhu:'#17100f', qing:'#0c1512', xuan:'#f3ece0', ye:'#0c111a' };

function applyTheme(id) {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  document.documentElement.dataset.theme = t.id;
  LS.setItem('yibu_theme', t.id);
  const mc = $('#themeColor'); if (mc) mc.setAttribute('content', BGMAP[t.id]);
  // 原生端：状态栏与导航栏跟随配色
  try {
    if (window.Android && window.Android.setChrome) window.Android.setChrome(BGMAP[t.id], t.id === 'xuan');
  } catch (e) {}
  const hint = $('#themeHint'); if (hint) hint.textContent = t.tip;
  document.querySelectorAll('#themeList .swatch').forEach(b => b.classList.toggle('on', b.dataset.theme === t.id));
}
function applyFs(v) {
  v = String(v || 2);
  document.documentElement.dataset.fs = v;
  LS.setItem('yibu_fs', v);
  document.querySelectorAll('#fsSeg button').forEach(b => b.classList.toggle('on', b.dataset.fs === v));
}
function renderThemeList() {
  const box = $('#themeList'); box.innerHTML = '';
  THEMES.forEach(t => {
    const b = el('button', 'swatch');
    b.dataset.theme = t.id;
    b.innerHTML = `<div class="band" style="background:${t.band};color:${t.tc}">☰</div><div class="lbl">${t.name}</div>`;
    b.addEventListener('click', () => { applyTheme(t.id); toast('配色：' + t.name); });
    box.appendChild(b);
  });
}

/* ---------- 爻线 ---------- */
function yaoEl(isYang, moving, filled) {
  const y = el('div', 'yao ' + (isYang ? 'yang' : 'yin') + (moving ? ' moving' : '') + (filled ? '' : ' slot'));
  y.innerHTML = isYang ? '<i></i>' : '<i></i><i></i>';
  return y;
}
function stackEl(lines, movingSet, gap) {
  const box = el('div', 'stack');
  if (gap) box.style.gap = gap;
  for (let p = 6; p >= 1; p--) {
    const row = el('div', 'row');
    const isYang = lines[p-1] === 1;
    const mv = movingSet && movingSet.has(p);
    row.appendChild(yaoEl(isYang, mv, true));
    if (movingSet) row.appendChild(el('div', 'mark', mv ? (isYang ? '○' : '×') : ''));
    box.appendChild(row);
  }
  return box;
}
function uniHex(h) { return String.fromCodePoint(0x4DBF + h.no); }

/* ---------- 视图 ---------- */
let CUR = null, MODE = 'coin', ASK_CAT = '';

function go(v) {
  ['cast','result','lib','hist','set'].forEach(x => $('#v-' + x).classList.toggle('hidden', x !== v));
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'result' && !CUR) $('#v-result').innerHTML = '<div class="empty">还没有卦<br>先去起一卦</div>';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------- 占问 ---------- */
function renderChips() {
  const box = $('#askChips'); box.innerHTML = '';
  ['事业','感情','财运','健康','学业','出行'].forEach(c => {
    const b = el('button', 'chip' + (ASK_CAT === c ? ' on' : ''), c);
    b.addEventListener('click', () => { ASK_CAT = (ASK_CAT === c ? '' : c); renderChips(); });
    box.appendChild(b);
  });
}
function askText() {
  const t = ($('#askInput').value || '').trim();
  return (ASK_CAT ? ASK_CAT + '　' : '') + t;
}

/* ---------- 铜钱 ---------- */
let coinLines = [];
function coinOne() {
  const cs = [0,0,0].map(() => Math.random() < 0.5 ? 3 : 2);
  return { cs, sum: cs.reduce((a,b) => a + b, 0) };
}
function paintCoins(cs) {
  const nodes = $('#coins').children;
  cs.forEach((v, i) => {
    const n = nodes[i];
    n.textContent = v === 3 ? '背' : '字';
    n.classList.toggle('back', v === 3);
    n.classList.remove('spin'); void n.offsetWidth; n.classList.add('spin');
  });
}
function renderCastStack() {
  const box = $('#castStack'); box.innerHTML = '';
  for (let p = 6; p >= 1; p--) {
    const rec = coinLines[p-1];
    const row = el('div', 'row');
    if (rec) {
      const isYang = (rec.sum === 7 || rec.sum === 9);
      row.appendChild(yaoEl(isYang, rec.sum === 6 || rec.sum === 9, true));
      row.appendChild(el('div', 'mark', (rec.sum === 9) ? '○' : (rec.sum === 6 ? '×' : '')));
    } else {
      row.appendChild(yaoEl(true, false, false));
      row.appendChild(el('div', 'mark', ''));
    }
    box.appendChild(row);
  }
  const n = coinLines.length;
  $('#btnShake').textContent = n >= 6 ? '已 成 卦' : '摇 第 ' + ['','一','二','三','四','五','六'][n+1] + ' 爻';
  $('#btnShake').disabled = n >= 6;
  $('#castTip').textContent = n >= 6 ? '六爻已成' : '自下而上，共摇六次（' + n + '/6）';
}
function shakeOnce(cb) {
  const r = coinOne();
  paintCoins(r.cs);
  setTimeout(() => {
    coinLines.push(r); renderCastStack();
    const map = { 6:'老阴 ×（变阳）', 7:'少阳', 8:'少阴', 9:'老阳 ○（变阴）' };
    $('#coinLegend').textContent = '三背三字之和 ' + r.sum + ' → ' + map[r.sum];
    cb && cb();
  }, 250);
}

/* ---------- 结果渲染 ---------- */
function showResult(c) {
  CUR = c;
  const j = judgeRule(c), g = grade(c, j);
  const B = c.ben, V = c.bian, H = c.hu;
  const wrap = $('#v-result'); wrap.innerHTML = '';

  // 头部
  const head = el('div', 'card');
  if (c.ask) head.appendChild(el('div', '', `<div style="text-align:center;font-size:12px;color:var(--text3);margin-bottom:6px">所占：${c.ask}</div>`));
  head.appendChild(el('div', '', `<div style="text-align:center;font-size:11px;color:var(--text3);letter-spacing:.14em">${c.label}</div>`));
  const hh = el('div', 'hexhead');
  hh.appendChild(el('div', '', `<div class="uni">${uniHex(B)}</div>`));
  const nm = el('div', 'hexname');
  nm.innerHTML = `<div class="n">${B.name}</div><div class="f">第${B.no}卦 · ${B.full}</div>`;
  hh.appendChild(nm);
  if (!c.same) {
    hh.appendChild(el('div', 'arrow', '→'));
    hh.appendChild(el('div', '', `<div class="uni" style="opacity:.75">${uniHex(V)}</div>`));
    const nm2 = el('div', 'hexname');
    nm2.innerHTML = `<div class="n" style="font-size:21px">${V.name}</div><div class="f">变卦 ${V.full}</div>`;
    hh.appendChild(nm2);
  }
  head.appendChild(hh);

  const pair = el('div', 'pair');
  const c1 = el('div', 'col'); c1.appendChild(el('div', 'cap', '本 卦'));
  c1.appendChild(stackEl(c.benBits, new Set(c.moving)));
  c1.appendChild(el('div', 'cn', `${B.upSym}${B.lowSym} ${B.xiangName}`));
  pair.appendChild(c1);
  const c2 = el('div', 'col'); c2.appendChild(el('div', 'cap', c.same ? '无 变 爻' : '变 卦'));
  c2.appendChild(stackEl(c.bianBits, null));
  c2.appendChild(el('div', 'cn', `${V.upSym}${V.lowSym} ${V.xiangName}`));
  pair.appendChild(c2);
  head.appendChild(pair);
  head.appendChild(el('div', '', `<div style="text-align:center;font-size:11px;color:var(--text3);margin-top:10px">
    动爻：${c.moving.length ? c.moving.map(p => yaoName(p, c.benBits[p-1] === 1)).join('、') : '无（静卦）'}
    · 互卦 ${H.name}</div>`));
  wrap.appendChild(head);

  // 吉凶
  const gc = el('div', 'card');
  const gr = el('div', 'grade');
  gr.appendChild(el('div', 'lv ' + g.cls, g.word));
  gr.appendChild(el('div', 'why', `辞气：吉语 ${g.g} · 凶语 ${g.b}<br>${j.rule}`));
  gc.appendChild(gr);
  gc.appendChild(el('div', '', B.tags.map(t => `<span class="tag">${t}</span>`).join('')));
  wrap.appendChild(gc);

  // 断辞
  const jc = el('div', 'card');
  jc.appendChild(el('h3', '', '断 辞'));
  j.refs.forEach(r => jc.appendChild(el('div', 'classic', `<div class="t">${r.t}</div><div class="c">${r.c}</div>`)));
  jc.appendChild(el('div', 'txt', `<span class="kw">${B.tips}</span>`));
  wrap.appendChild(jc);

  // 经文
  const yc = el('div', 'card');
  yc.appendChild(el('h3', '', '经 文'));
  yc.appendChild(el('div', 'classic', `<div class="t">${B.name} · 卦辞</div><div class="c">${B.gua}</div>`));
  const list = el('div', 'yaolist');
  for (let p = 6; p >= 1; p--) {
    const isYang = c.benBits[p-1] === 1, hit = c.moving.includes(p);
    const it = el('div', 'yitem' + (hit ? ' hit' : ''));
    it.innerHTML = `<div class="yn">${yaoName(p, isYang)}</div><div class="yc">${B.yao[p-1]}</div>`
      + (hit ? `<div class="badge">${isYang ? '○' : '×'}</div>` : '');
    list.appendChild(it);
  }
  yc.appendChild(list);
  if (!c.same) yc.appendChild(el('div', 'classic', `<div class="t">变卦 ${V.name} · 卦辞</div><div class="c">${V.gua}</div>`));
  wrap.appendChild(yc);

  // 卦意
  const rd = el('div', 'card');
  rd.appendChild(el('h3', '', '卦 意'));
  rd.appendChild(el('div', 'txt', `<span class="kw">${B.name}</span>：${B.read}`));
  rd.appendChild(el('div', 'txt', `<span class="kw">卦象</span>：${B.xiang}`));
  if (!c.same) rd.appendChild(el('div', 'txt', `<span class="kw">走向</span>：事由「${B.name}」转为「${V.name}」。${V.read}`));
  if (c.moving.length) {
    const p = c.moving[c.moving.length - 1];
    rd.appendChild(el('div', 'txt', `<span class="kw">动爻</span>：${yaoName(p, c.benBits[p-1] === 1)}，${POS_HINT[p]}。${POS_TIP[p]}`));
  }
  const rel = el('div', 'rel');
  const mkRel = (label, h) => {
    const b = el('button', '', `${label}<br><b>${h.name}</b> · ${h.full}`);
    b.addEventListener('click', () => showResult(buildChart(h.bits.map(x => x ? 7 : 8), label + ' · ' + h.full, '')));
    return b;
  };
  rel.appendChild(mkRel('错卦（六爻全反）', c.cuo));
  rel.appendChild(mkRel('综卦（上下颠倒）', c.zong));
  rd.appendChild(rel);
  wrap.appendChild(rd);

  // 分占
  const fc = el('div', 'card');
  fc.appendChild(el('h3', '', '分 占'));
  fieldRead(c).forEach(([k, v]) => fc.appendChild(el('div', 'kv', `<b>${k}</b><span>${v}</span>`)));
  wrap.appendChild(fc);

  // 操作
  const act = el('div', 'card');
  const cp = el('button', 'btn', '复 制 此 卦');
  cp.addEventListener('click', () => copyText(plainResult(c)));
  act.appendChild(cp);
  const b2 = el('div', 'btn2');
  const again = el('button', 'btn ghost', '再 占 一 卦');
  const saveBtn = el('button', 'btn ghost', '存 入 记 录');
  again.addEventListener('click', () => go('cast'));
  saveBtn.addEventListener('click', () => { saveHist(c); });
  b2.appendChild(again); b2.appendChild(saveBtn);
  act.appendChild(b2);
  wrap.appendChild(act);

  go('result');
}

/* ---------- 复制 ---------- */
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(() => toast('已复制'), () => fallbackCopy(t));
  } else fallbackCopy(t);
}
function fallbackCopy(t) {
  const ta = document.createElement('textarea');
  ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); }
  ta.remove();
}

/* ---------- 记录 ---------- */
function saveHist(c) {
  let arr = [];
  try { arr = JSON.parse(LS.getItem('gua_hist') || '[]'); } catch (e) { arr = []; }
  arr.unshift({
    label: c.label, ask: c.ask || '', ben: c.ben.name, bian: c.bian.name,
    no: c.ben.no, bno: c.bian.no, moving: c.moving, bits: c.benBits.join(''),
    cuo: c.cuo.no, zong: c.zong.no, t: new Date().toISOString()
  });
  LS.setItem('gua_hist', JSON.stringify(arr.slice(0, 80)));
  toast('已存入记录');
  renderHist();
}
function histArr() {
  try { return JSON.parse(LS.getItem('gua_hist') || '[]'); } catch (e) { return []; }
}
function chartFromHist(it) {
  const vals = it.bits.split('').map((b, i) =>
    it.moving.includes(i + 1) ? (b === '1' ? 9 : 6) : (b === '1' ? 7 : 8));
  const c = buildChart(vals, it.label, it.ask);
  return c;
}
function renderHist() {
  const box = $('#histList'); box.innerHTML = '';
  const arr = histArr();
  if (!arr.length) { box.appendChild(el('div', 'empty', '还没有记录<br>占一卦试试')); return; }
  arr.forEach((it, idx) => {
    const B = BY_NO[it.no];
    const card = el('div', 'card histitem');
    card.innerHTML = `<div class="h-sym">${B ? B.upSym + B.lowSym : ''}</div>
      <div class="h-body">
        <div class="h-name">${it.ben}${it.moving.length ? ' → ' + it.bian : '（静卦）'}</div>
        <div class="h-meta">${new Date(it.t).toLocaleString('zh-CN')}${it.ask ? ' · ' + it.ask : ''}</div>
      </div>
      <div class="h-del">×</div>`;
    card.addEventListener('click', e => {
      if (e.target.classList.contains('h-del')) {
        const a = histArr(); a.splice(idx, 1); LS.setItem('gua_hist', JSON.stringify(a));
        renderHist(); toast('已删除');
        return;
      }
      showResult(chartFromHist(it));
    });
    box.appendChild(card);
  });
}

/* ---------- 卦典 ---------- */
function renderLib(kw) {
  const box = $('#libGrid'); box.innerHTML = '';
  const k = (kw || '').trim();
  const list = HEX.filter(h => !k ||
    (h.name + h.full + h.gua + h.xiangName + h.tags.join('') + h.yao.join('') + h.read).includes(k));
  if (!list.length) { box.appendChild(el('div', 'empty', '没有找到')); return; }
  list.forEach(h => {
    const cell = el('div', 'gcell');
    cell.innerHTML = `<div class="s">${h.upSym}${h.lowSym}</div><div class="nm">${h.name}</div><div class="no">${h.no} ${h.xiangName}</div>`;
    cell.addEventListener('click', () => showResult(buildChart(h.bits.map(b => b ? 7 : 8), '卦典 · ' + h.full, '')));
    box.appendChild(cell);
  });
}
function renderBagua() {
  const order = ['qian','dui','li','zhen','xun','kan','gen','kun'];
  const num = { qian:1, dui:2, li:3, zhen:4, xun:5, kan:6, gen:7, kun:8 };
  const box = $('#baguaTable'); box.innerHTML = '';
  order.forEach(k => {
    const t = TR[k];
    const r = el('div', 'kv');
    r.innerHTML = `<b style="width:40px;font-size:19px;color:var(--brand);line-height:1.2">${t.sym}</b>
      <span>${t.cn} · 象${t.xiang} · 德${t.de}<span style="color:var(--text3)">　先天${num[k]}　主${t.body}</span></span>`;
    r.style.alignItems = 'center';
    box.appendChild(r);
  });
}

/* ---------- 每日一卦 ---------- */
function renderDaily() {
  const h = dailyHex();
  const box = $('#dailyCard');
  box.innerHTML = `<div class="d-uni">${uniHex(h)}</div>
    <div class="d-body"><div class="d-name">今日一卦 · ${h.name} <span style="font-size:11px;color:var(--text3)">${h.full}</span></div>
    <div class="d-txt">${h.gua}</div></div>
    <div style="color:var(--text3)">›</div>`;
  box.onclick = () => showResult(buildChart(h.bits.map(b => b ? 7 : 8), '今日一卦', ''));
}

/* ---------- 时间 ---------- */
function nowStr() {
  const d = new Date(), sc = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const zhi = sc[Math.floor(((d.getHours() + 1) % 24) / 2)];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}（${zhi}时）`;
}
function tick() {
  const d = new Date(), sc = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  $('#clock').textContent = `${sc[Math.floor(((d.getHours()+1)%24)/2)]}时 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  $('#timeNow').textContent = nowStr();
}

/* ---------- 手动排卦 ---------- */
const HAND_STATES = [7, 9, 8, 6];
let handVals = [7,7,7,7,7,7];
function renderHand() {
  const box = $('#handStack'); box.innerHTML = '';
  for (let p = 6; p >= 1; p--) {
    const v = handVals[p-1];
    const row = el('div', 'row'); row.style.cursor = 'pointer';
    row.appendChild(yaoEl(v === 7 || v === 9, v === 6 || v === 9, true));
    row.appendChild(el('div', 'mark', v === 9 ? '○' : (v === 6 ? '×' : '')));
    row.appendChild(el('div', '', `<span style="font-size:12px;color:var(--text3);margin-left:4px">${yaoName(p, v === 7 || v === 9)}</span>`));
    row.addEventListener('click', () => {
      handVals[p-1] = HAND_STATES[(HAND_STATES.indexOf(handVals[p-1]) + 1) % 4];
      renderHand();
    });
    box.appendChild(row);
  }
}

/* ---------- 事件绑定 ---------- */
function bind() {
  document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));

  document.querySelectorAll('#modeSeg button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#modeSeg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      MODE = b.dataset.mode;
      ['coin','time','num','hand'].forEach(m => $('#p-' + m).classList.toggle('hidden', m !== MODE));
    });
  });

  $('#btnShake').addEventListener('click', () => {
    if (coinLines.length >= 6) return;
    shakeOnce(() => { if (coinLines.length === 6) setTimeout(() => showResult(buildChart(coinLines.map(r => r.sum), '铜钱摇卦', askText())), 400); });
  });
  $('#btnQuick').addEventListener('click', () => {
    while (coinLines.length < 6) coinLines.push(coinOne());
    renderCastStack();
    const s = coinLines[5].sum;
    const map = { 6:'老阴 ×（变阳）', 7:'少阳', 8:'少阴', 9:'老阳 ○（变阴）' };
    $('#coinLegend').textContent = '三背三字之和 ' + s + ' → ' + map[s];
    setTimeout(() => showResult(buildChart(coinLines.map(r => r.sum), '铜钱摇卦', askText())), 220);
  });
  $('#btnReset').addEventListener('click', () => {
    coinLines = []; renderCastStack();
    $('#coinLegend').textContent = '背为阳 · 字为阴';
    $('#coins').querySelectorAll('.coin').forEach(c => { c.textContent = '背'; c.classList.remove('back'); });
  });

  $('#btnTime').addEventListener('click', () => {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    const zhi = Math.floor(((d.getHours() + 1) % 24) / 2) + 1;
    const up = ((y + m + day) % 8) || 8;
    const low = ((y + m + day + zhi) % 8) || 8;
    const mv = ((y + m + day + zhi) % 6) || 6;
    const vals = [...T_VALS[N2T[low]], ...T_VALS[N2T[up]]];
    vals[mv-1] = vals[mv-1] === 7 ? 9 : 6;
    showResult(buildChart(vals, '时间起卦', askText()));
  });

  $('#btnNum').addEventListener('click', () => {
    const a = parseInt($('#numA').value, 10), b = parseInt($('#numB').value, 10);
    if (!(a > 0) || !(b > 0)) { toast('请填入两个正整数'); return; }
    let c = parseInt($('#numC').value, 10);
    if (!(c > 0)) c = a + b;
    const up = (a % 8) || 8, low = (b % 8) || 8, mv = (c % 6) || 6;
    const vals = [...T_VALS[N2T[low]], ...T_VALS[N2T[up]]];
    vals[mv-1] = vals[mv-1] === 7 ? 9 : 6;
    showResult(buildChart(vals, `数字起卦 · ${a}/${b}/${c}`, askText()));
  });

  $('#btnHand').addEventListener('click', () => showResult(buildChart([...handVals], '手动排卦', askText())));

  $('#libSearch').addEventListener('input', e => renderLib(e.target.value));

  $('#btnClearHist').addEventListener('click', () => {
    LS.removeItem('gua_hist'); renderHist(); toast('已清空');
  });
  $('#btnExport').addEventListener('click', () => {
    const arr = histArr();
    if (!arr.length) { toast('暂无记录'); return; }
    const txt = arr.map(it => {
      const c = chartFromHist(it);
      return plainResult(c).split('\n').slice(0, 6).join('\n');
    }).join('\n\n');
    copyText(txt);
  });

  document.querySelectorAll('#fsSeg button').forEach(b => {
    b.addEventListener('click', () => { applyFs(b.dataset.fs); toast('字号已调整'); });
  });
  $('#btnResetAll').addEventListener('click', () => {
    applyTheme('ink'); applyFs(2); toast('已恢复默认');
  });
}

/* ---------- 启动 ---------- */
function init() {
  renderThemeList();
  applyTheme(LS.getItem('yibu_theme') || 'ink');
  applyFs(LS.getItem('yibu_fs') || 2);
  renderChips();
  renderCastStack();
  renderHand();
  renderLib('');
  renderBagua();
  renderDaily();
  renderHist();
  bind();
  tick(); setInterval(tick, 1000);
  go('cast');
}
init();
