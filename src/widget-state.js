/**
 * Состояние виджета-карточки. У виджета два состояния, каждое до 1024 байт UTF-8,
 * бот меняет оба одним вызовом editMessageWidgetData:
 *
 *   chat_data — составы:
 *     { v: ревизия, m: [ { t: "название", k: крепость 1–5,
 *                          p: [ [доля %, "вкус", "бренд линейка", [пачки г], цвет 0–7], … ] }, … ],
 *       r: [оценка микса 1, 2, 3] (1 / -1 / 0, необязательно) }
 *     Пока миксы собираются: { v, w: 1 }.  Ошибка: { v, e: "текст" }.
 *
 *   public_data — тексты: { v, o: "менеджер", n: "строка над вкладками", d: ["описание 1", "2", "3"] }
 *
 * Миксы — в формате первого бота (validateMixes): { title, text, strength, parts: [{ p, item: { n, b, l, w, g } }] }.
 */

export const STATE_LIMIT = 1024;

// Цвет доли по направлению вкуса — индексы палитры C в виджете.
const GROUP_COLOR = { 'Фруктовый': 0, 'Ягодный': 1, 'Цитрусовый': 2, 'Освежающий': 3, 'Десертный': 4 };
const SPARE = [5, 6, 7, 0, 1, 2, 3, 4];

export const bytes = (s) => new TextEncoder().encode(s).length;

/** Обрезка по слову, с многоточием. */
export function cut(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const head = s.slice(0, n - 1);
  const sp = head.lastIndexOf(' ');
  return (sp > n * 0.6 ? head.slice(0, sp) : head).replace(/[\s,.;:—-]+$/, '') + '…';
}

export function brandLine(it, withLine = true) {
  return it.b + (withLine && it.l && it.l !== 'Основная' ? ' ' + it.l : '');
}

/** Цвета долей одного микса: по направлению вкуса, без повторов внутри микса. */
function colors(parts) {
  const used = new Set();
  return parts.map((p) => {
    const g = (p.item.g || []).map((x) => GROUP_COLOR[x]).find((c) => c != null && !used.has(c));
    const c = g != null ? g : SPARE.find((x) => !used.has(x));
    used.add(c);
    return c;
  });
}

export function contactName(contact) {
  const u = String(contact || '').trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '');
  return /^[a-z][a-z0-9_]{3,31}$/i.test(u) ? u : '';
}

const first = (variants) => variants.find((s) => bytes(s) <= STATE_LIMIT);

/**
 * Упаковать миксы в оба состояния. Если не влезает — ужимаем по шагам:
 * составы: без названий линеек → короче названия миксов; тексты: описания короче → без описаний.
 */
export function packState(mixes, { contact = '', note = '', rev = 1, ratings = null } = {}) {
  const chat = first([[1, 60], [0, 60], [0, 32], [0, 20]].map(([withLine, tLen]) => JSON.stringify({
    v: rev,
    m: mixes.map((m) => {
      const cs = colors(m.parts);
      return {
        t: cut(m.title, tLen),
        k: m.strength | 0,
        p: m.parts.map((p, j) => {
          const w = Array.isArray(p.item.w) ? [...new Set(p.item.w)].sort((a, b) => a - b) : [];
          return [p.p, p.item.n, brandLine(p.item, withLine), w, cs[j]];
        }),
      };
    }),
    ...(ratings && ratings.some(Boolean) ? { r: ratings } : {}),
  })));
  if (!chat) throw new Error('state: составы трёх миксов не влезают в 1024 байта');

  const o = contactName(contact);
  const pub = first([140, 110, 80, 50, 0].map((dLen) => JSON.stringify({
    v: rev,
    ...(o ? { o } : {}),
    ...(note ? { n: cut(note, 100) } : {}),
    ...(dLen ? { d: mixes.map((m) => cut(m.short || m.text, dLen)) } : {}),
  })));
  return { chat_data: chat, public_data: pub };
}

export const loadingState = (rev = 1) => JSON.stringify({ v: rev, w: 1 });
export const errorState = (text, rev = 1) => JSON.stringify({ v: rev, e: cut(text, 200) });

/** Подпись под виджетом: видна в списке чатов, уведомлениях и в старых приложениях без виджетов. */
export function caption(mixes) {
  const line = (m, i) => cut(`${i + 1}. ${m.title.toLocaleUpperCase('ru')} — ` + m.parts.map((p) => `${p.item.n} ${p.p}%`).join(', '), 320);
  return mixes.map(line).join('\n');
}
