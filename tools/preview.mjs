// Превью и проверка поведения виджета в обычном Chrome с заглушкой TelegramWidget.
// Запуск: node tools/preview.mjs  → скриншоты в preview/
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { packState, loadingState } from '../src/widget-state.js';
import { typical, heavy } from './samples.mjs';

const html = readFileSync(new URL('../widget/mix-card.html', import.meta.url), 'utf8');
const dir = new URL('../preview/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });

const THEMES = {
  light: { bubble: '#ffffff', vars: { 'bg-color': '#ffffff', 'text-color': '#000000', 'hint-color': '#707579', 'link-color': '#3390ec', 'button-color': '#3390ec', 'button-text-color': '#ffffff', 'secondary-bg-color': '#f1f1f4', 'section-separator-color': '#e7e7e7', 'destructive-text-color': '#e53935' } },
  dark: { bubble: '#182533', vars: { 'bg-color': '#17212b', 'text-color': '#f5f5f5', 'hint-color': '#708499', 'link-color': '#6ab3f3', 'button-color': '#5288c1', 'button-text-color': '#ffffff', 'secondary-bg-color': '#232e3c', 'section-separator-color': '#0f1923', 'destructive-text-color': '#ec3942' } },
};

// Заглушка повторяет правила из документации: один вызов request/openLink/openTelegramLink/copyText на нажатие,
// вне нажатия — только фоновые запросы, не чаще раза в 5 секунд.
const stub = (chatData, publicData) => `
<script>
(() => {
  let tap = false, lastBg = -1e9;
  addEventListener('click', () => { tap = true; setTimeout(() => (tap = false), 0); }, true);
  const gate = () => { if (!tap) return false; tap = false; return true; };
  const H = {};
  window.__log = [];
  window.TelegramWidget = {
    profile: 1, isProfileAtLeast: (n) => n <= 1, colorScheme: 'light', themeParams: {}, isActive: true,
    isPreview: false, isForward: false, chatType: 'private', viewer: { id: 1, first_name: 'Test' },
    chatData: ${JSON.stringify(chatData)}, publicData: ${JSON.stringify(publicData)}, wallet: null,
    contentSafeAreaInset: { top: 0, right: 0, bottom: 0, left: 0, cornerLeft: 0, cornerRight: 0 },
    HapticFeedback: { impactOccurred() { return this; }, notificationOccurred() { return this; }, selectionChanged() { return this; } },
    onEvent(t, f) { (H[t] = H[t] || []).push(f); }, offEvent() {}, ready() { __log.push('ready'); }, setResizeAnchor() {},
    openTelegramLink(u) { if (u.length > 256) throw new TypeError('long'); if (!gate()) throw new Error('no tap'); __log.push('link ' + u); },
    openLink() {}, copyText() {},
    request(d) {
      const byTap = gate(), now = Date.now();
      if (!byTap) { if (now - lastBg < 5000) { __log.push('request REFUSED ' + d); return Promise.reject(Object.assign(new Error(), { name: 'WidgetRequestError', code: 'RATE_LIMITED' })); } lastBg = now; }
      __log.push('request ' + d + (byTap ? ' (tap)' : ' (background)'));
      return new Promise((r) => setTimeout(() => r({ result: '1' }), 150));
    },
    __set(c, p) { this.chatData = c; if (p !== undefined) this.publicData = p; (H.chatDataChanged || []).forEach((f) => f()); (H.publicDataChanged || []).forEach((f) => f()); },
  };
})();
</script>`;

const page0 = (theme, c, p) => `<!doctype html><meta charset=utf-8><style>
:root{${Object.entries(THEMES[theme].vars).map(([k, v]) => `--tg-theme-${k}:${v};`).join('')}--tg-color-scheme:${theme}}
html{background:${THEMES[theme].bubble};color:var(--tg-theme-text-color);font:15px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
body{margin:8px 12px}</style>${stub(c, p)}${html}`;

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 2 });
let doc = '';
await ctx.route('http://widget.test/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: doc }));
const open = async (theme, c, p) => { const pg = await ctx.newPage(); doc = page0(theme, c, p); await pg.goto('http://widget.test/' + Math.random()); return pg; };
const note = 'Catmint сейчас нет в наличии — собрал похожие по вкусу';
const T = packState(typical, { contact: '@vektor_sigma_manager', rev: 2 });
const Hv = packState(heavy, { contact: '@vektor_sigma_manager', note, rev: 2 });

async function shot(name, theme, c, p, act) {
  const page = await open(theme, c, p);
  if (act) await act(page);
  await page.waitForTimeout(200);
  const h = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height) + 16);
  await page.setViewportSize({ width: 320, height: h });
  await page.screenshot({ path: dir + name + '.png' });
  const log = await page.evaluate(() => __log);
  console.log(`${name}: высота ${h} px ${h <= 560 ? '✓' : '✗ больше 560'}`);
  await page.close();
  return log;
}

await shot('1-loading', 'light', loadingState(1), null);
await shot('2-typical-light', 'light', T.chat_data, T.public_data);
await shot('3-typical-dark', 'dark', T.chat_data, T.public_data);
await shot('4-heavy-tab2-rated', 'light', Hv.chat_data, Hv.public_data, async (pg) => {
  await pg.click('.tb button:nth-child(2)');
  await pg.click('.r >> nth=0');
  await pg.waitForTimeout(300);
});

// Поведение: загрузка → миксы приходят правкой состояния; заказ → чат менеджера + отметка фоном.
const page = await open('light', loadingState(1), null);
await page.evaluate(([c, p]) => TelegramWidget.__set(c, p), [Hv.chat_data, Hv.public_data]);
console.log('после правки состояния вкладок:', await page.locator('.tb button').count());
await page.click('.o');
await page.waitForTimeout(6800); // повтор фоновой отметки через 6 с
for (const l of await page.evaluate(() => __log)) console.log('  ', l.startsWith('link ') ? 'link ' + l.length + ' симв. → ' + decodeURIComponent(l.split('?text=')[1] || '') : l);
console.log('очередь отметок после повтора:', await page.evaluate(() => localStorage.getItem('s')));
// Ссылки заказа для всех миксов
for (const [name, st] of [['обычные', T], ['тяжёлые', Hv]]) {
  const p2 = await open('light', st.chat_data, st.public_data);
  for (let i = 0; i < 3; i++) {
    await p2.click(`.tb button:nth-child(${i + 1})`);
    await p2.click('.o');
    await p2.waitForTimeout(100);
  }
  const links = (await p2.evaluate(() => __log)).filter((l) => l.startsWith('link '));
  console.log(name + ':');
  for (const l of links) console.log(`   ${l.length - 5} симв.: ${JSON.stringify(decodeURIComponent(l.split('?text=')[1] || '(без текста)'))}`);
  await p2.close();
}
await browser.close();
