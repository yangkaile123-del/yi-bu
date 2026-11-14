/* ================= 数据与算法核心 ================= */
const HEX = JSON.parse(document.getElementById('hexdata').textContent);
const BY_BITS = {}; HEX.forEach(h => BY_BITS[h.bitsStr] = h);
const BY_NO = {}; HEX.forEach(h => BY_NO[h.no] = h);

const TR = {
  qian: { cn:'乾', sym:'☰', xiang:'天', de:'健', body:'首' },
  dui : { cn:'兑', sym:'☱', xiang:'泽', de:'悦', body:'口' },
  li  : { cn:'离', sym:'☲', xiang:'火', de:'丽', body:'目' },
  zhen: { cn:'震', sym:'☳', xiang:'雷', de:'动', body:'足' },
  xun : { cn:'巽', sym:'☴', xiang:'风', de:'入', body:'股' },
  kan : { cn:'坎', sym:'☵', xiang:'水', de:'陷', body:'耳' },
  gen : { cn:'艮', sym:'☶', xiang:'山', de:'止', body:'手' },
  kun : { cn:'坤', sym:'☷', xiang:'地', de:'顺', body:'腹' }
};
/* 先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8 */
const N2T = [null, 'qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];
/* 三爻（初→上）→ 卦键 */
const T_BITS = {
  qian:[1,1,1], dui:[1,1,0], li:[1,0,1], zhen:[1,0,0],
  xun:[0,1,1], kan:[0,1,0], gen:[0,0,1], kun:[0,0,0]
};
/* 八卦 → 少阴少阳三爻（7 阳 / 8 阴），用于时间与数字起卦 */
const T_VALS = {
  qian:[7,7,7], dui:[7,7,8], li:[7,8,7], zhen:[7,8,8],
  xun:[8,7,7], kan:[8,7,8], gen:[8,8,7], kun:[8,8,8]
};

function trigramKey(bits3) {
  for (const k in T_BITS) {
    const t = T_BITS[k];
    if (t[0] === bits3[0] && t[1] === bits3[1] && t[2] === bits3[2]) return k;
  }
  return 'qian';
}
function hexOf(bits) { return BY_BITS[bits.join('')]; }

function yaoName(pos, isYang) {
  const n = isYang ? '九' : '六';
  if (pos === 1) return '初' + n;
  if (pos === 6) return '上' + n;
  return n + ['', '', '二', '三', '四', '五'][pos];
}
const POS_HINT = ['', '事之始，力未足，宜潜', '处内卦之中，得位而正', '居下卦之上，进退之交',
  '已出内卦，近事之主', '外卦之中，事之主位', '事之终，过则悔'];
const POS_TIP = ['', '起步阶段：别急，先把根扎住', '内部已正：守住中道，不必外求',
  '将出未出：最易反复，稳住步调', '刚入外局：谨慎试探，别一次押满',
  '主位在手：该决断时决断', '事到尽头：再进就是过，收比进重要'];

/* ---------- 成卦 ---------- */
// vals[0..5]：初→上，取 6 老阴 / 7 少阳 / 8 少阴 / 9 老阳
function buildChart(vals, label, ask) {
  const ben  = vals.map(v => (v === 7 || v === 9) ? 1 : 0);
  const bian = vals.map(v => v === 9 ? 0 : v === 6 ? 1 : (v === 7 ? 1 : 0));
  const moving = [];
  vals.forEach((v, i) => { if (v === 6 || v === 9) moving.push(i + 1); });

  const benHex  = hexOf(ben);
  const bianHex = hexOf(bian);
  const huBits  = [ben[1], ben[2], ben[3], ben[2], ben[3], ben[4]];
  const cuoBits = ben.map(b => b ? 0 : 1);          // 错卦：六爻全反
  const zongBits = ben.slice().reverse();            // 综卦：上下颠倒

  return {
    label, ask: ask || '', vals,
    benBits: ben, bianBits: bian, moving,
    ben: benHex, bian: bianHex, hu: hexOf(huBits),
    cuo: hexOf(cuoBits), zong: hexOf(zongBits),
    huLow: trigramKey([ben[1], ben[2], ben[3]]),
    huUp: trigramKey([ben[2], ben[3], ben[4]]),
    same: ben.join('') === bian.join(''),
    time: new Date().toISOString()
  };
}

/* ---------- 断卦：朱子变占法 ---------- */
function judgeRule(c) {
  const n = c.moving.length, B = c.ben, V = c.bian;
  const yaoOf = (h, pos) => ({ name: yaoName(pos, h.bits[pos-1] === 1), text: h.yao[pos-1] });
  if (n === 0) return { rule:'六爻不动，以本卦卦辞断',
    refs:[{ t:`${B.name}卦卦辞`, c:B.gua }], main:B.gua };
  if (n === 1) {
    const y = yaoOf(B, c.moving[0]);
    return { rule:`一爻动，以本卦动爻「${y.name}」爻辞断`,
      refs:[{ t:`${B.name}卦 ${y.name}`, c:y.text }], main:y.text };
  }
  if (n === 2) {
    const a = yaoOf(B, c.moving[0]), b = yaoOf(B, c.moving[1]);
    return { rule:`二爻动，以本卦两动爻爻辞断，上爻「${b.name}」为主`,
      refs:[{ t:`${B.name}卦 ${a.name}`, c:a.text }, { t:`${B.name}卦 ${b.name}`, c:b.text }],
      main:b.text };
  }
  if (n === 3) return { rule:'三爻动，以本卦、变卦卦辞合断，本卦为主',
    refs:[{ t:`本卦 ${B.name}`, c:B.gua }, { t:`变卦 ${V.name}`, c:V.gua }],
    main:B.gua + ' ' + V.gua };
  if (n === 4) {
    const still = [1,2,3,4,5,6].filter(p => !c.moving.includes(p));
    const y0 = yaoOf(V, still[0]), y1 = yaoOf(V, still[1]);
    return { rule:`四爻动，以变卦中两不变爻断，下爻「${y0.name}」为主`,
      refs:[{ t:`${V.name}卦 ${y0.name}`, c:y0.text }, { t:`${V.name}卦 ${y1.name}`, c:y1.text }],
      main:y0.text };
  }
  if (n === 5) {
    const still = [1,2,3,4,5,6].filter(p => !c.moving.includes(p))[0];
    const y = yaoOf(V, still);
    return { rule:`五爻动，以变卦不变爻「${y.name}」断`,
      refs:[{ t:`${V.name}卦 ${y.name}`, c:y.text }], main:y.text };
  }
  if (B.no === 1 || B.no === 2) {
    const t = B.no === 1 ? '见群龙无首，吉。' : '利永贞。';
    return { rule:'六爻全动，乾用九、坤用六断',
      refs:[{ t: B.no === 1 ? '用九' : '用六', c:t }], main:t };
  }
  return { rule:'六爻全动，以变卦卦辞断',
    refs:[{ t:`变卦 ${V.name}`, c:V.gua }], main:V.gua };
}

/* ---------- 吉凶：辞气 ---------- */
const GOOD = ['元吉','大吉','吉','无咎','悔亡','利','亨','有孚','无不利','利有攸往','利涉大川','终吉','有喜'];
const BAD  = ['凶','吝','厉','灾','眚','不利','蔑贞','泣血','灭','折','焚','死','丧','困于','危','险','败'];
function scanTxt(text) {
  let g = 0, b = 0;
  GOOD.forEach(w => { g += text.split(w).length - 1; });
  BAD.forEach(w => { b += text.split(w).length - 1; });
  return { g, b };
}
function grade(c, j) {
  const src = c.ben.gua + j.main + c.ben.read;
  const { g, b } = scanTxt(src);
  const s = g - b * 1.15;
  if (s >= 2.6)  return { word:'大吉', cls:'l1', s, g, b };
  if (s >= 1.1)  return { word:'吉',   cls:'l2', s, g, b };
  if (s > -1.2)  return { word:'平',   cls:'l3', s, g, b };
  if (s > -3)    return { word:'偏凶', cls:'l4', s, g, b };
  return { word:'凶', cls:'l5', s, g, b };
}

/* ---------- 分占 ---------- */
const BODY_TONE = {
  '健':'刚燥，防过劳与上火', '悦':'偏浮，防口舌与饮食', '丽':'偏热，防目疾与心神',
  '动':'偏躁，防足部与惊悸', '入':'偏散，防风寒与腿股', '陷':'偏寒，防耳鸣与肾水',
  '止':'偏滞，防脾胃积滞', '顺':'偏湿，防腹疾与消化'
};
function fieldRead(c) {
  const U = TR[c.ben.up], L = TR[c.ben.low];
  const BU = TR[c.bian.up], BL = TR[c.bian.low];
  const outMap = { '健':'刚健立势、主动出击', '悦':'以和悦相接、以情动人', '丽':'依附明主、把事做亮',
    '动':'先行发动、抢占先机', '入':'迂回渗透、寻缝而入', '陷':'涉险而行、步步设防',
    '止':'暂止不进、守位待时', '顺':'顺承配合、以厚载物' };
  const inMap = { '健':'实力在握、主导在我', '悦':'宜说宜谈、以柔取胜', '丽':'需有所依附、借势发光',
    '动':'动念已起、宜顺势而为', '入':'以渐入之法推进', '陷':'险在内、先自固',
    '止':'内部已止、不宜再催', '顺':'以稳为主、厚积待发' };
  const srcMap = { '健':'源头有力，可主动求财', '悦':'源头和顺，宜待人成事', '丽':'源头借势，宜依附平台',
    '动':'源头活络，动中得财', '入':'源头细流，宜渐进积累', '陷':'源头有险，忌重投',
    '止':'源头受限，宜守不宜扩', '顺':'源头平稳，细水长流' };
  const flowMap = { '健':'去路强劲，可放手推进', '悦':'进项可期，宜借人成事', '丽':'去路明亮，宜见光行事',
    '动':'去路多变，宜快进快出', '入':'去路迂回，宜缓图', '陷':'去路有阻，防套牢',
    '止':'去路闭塞，现金为王', '顺':'去路平稳，稳中求进' };
  return [
    ['事业', `外势${U.cn}（${U.xiang}·${U.de}），自身${L.cn}（${L.xiang}·${L.de}）。对外宜${outMap[U.de]}，对内则${inMap[L.de]}。` +
      (c.same ? '本卦无变，局面近期不易翻转，按既定节奏走。'
              : `局面终将转为${BU.cn}${BL.cn}之象：${c.bian.read.slice(0, 30)}…`)],
    ['情感', `上卦为对方之态，下卦为自己之心。${U.cn}者${U.xiang}，${L.cn}者${L.xiang}，` +
      (U.de === L.de ? '两情相类，易生共鸣，却也易同进同退、缺一补位'
                     : '一刚一柔、一进一止，互补则合，各执则离') + `。关键字：${c.ben.tags.join('、')}。`],
    ['财运', `${srcMap[L.de]}；${flowMap[U.de]}。`],
    ['身体', `按说卦取象，上卦${U.cn}主${U.body}，下卦${L.cn}主${L.body}，二处宜多留意。卦气${BODY_TONE[L.de]}。`]
  ];
}

/* ---------- 今日一卦 ---------- */
function dailyHex() {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  let x = seed;
  x = (x ^ (x >>> 13)) * 1274126177;
  x = (x ^ (x >>> 16)) >>> 0;
  return BY_NO[(x % 64) + 1];
}

/* ---------- 文本导出 ---------- */
function plainResult(c) {
  const j = judgeRule(c), g = grade(c, j), B = c.ben, V = c.bian, L = [];
  L.push(`【${c.label}】` + (c.ask ? `　所占：${c.ask}` : ''));
  L.push(`本卦：${B.name}（${B.full}）第${B.no}卦　卦辞：${B.gua}`);
  if (!c.same) L.push(`变卦：${V.name}（${V.full}）　卦辞：${V.gua}`);
  L.push(`动爻：${c.moving.length ? c.moving.map(p => yaoName(p, c.benBits[p-1] === 1)).join('、') : '无（静卦）'}`);
  L.push(`互卦：${c.hu.name}（${c.hu.full}）　错卦：${c.cuo.name}　综卦：${c.zong.name}`);
  L.push(`断法：${j.rule}`);
  j.refs.forEach(r => L.push(`${r.t}：${r.c}`));
  L.push(`吉凶：${g.word}`);
  L.push(`卦意：${B.read}`);
  if (!c.same) L.push(`走向：${V.read}`);
  L.push(`建议：${B.tips}`);
  L.push('—— 卦以决疑，事在人为');
  return L.join('\n');
}
