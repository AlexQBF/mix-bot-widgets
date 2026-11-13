// Сборка виджета: минификация + проверка лимитов Telegram (32 768 байт, 4 096 после zlib 9).
// Запуск: node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { minify } from 'html-minifier-terser';
import { packState, caption } from '../src/widget-state.js';
import { typical, heavy } from './samples.mjs';

const src = readFileSync(new URL('../widget/mix-card.src.html', import.meta.url), 'utf8');
const html = await minify(src, {
  collapseWhitespace: true, removeAttributeQuotes: true, removeComments: true,
  minifyCSS: { level: 2 }, minifyJS: { ecma: 2020, compress: { passes: 2 }, mangle: true },
});
const out = new URL('../widget/mix-card.html', import.meta.url);
writeFileSync(out, html);

// Сжатие считаем Python'ом — так же, как сервер Telegram.
const z = Number(execFileSync('python3', ['-c', 'import sys,zlib; print(len(zlib.compress(sys.stdin.buffer.read(), 9)))'], { input: html }).toString());
const raw = Buffer.byteLength(html);
console.log(`виджет: ${raw} байт, после zlib 9: ${z} из 4096 ${z <= 4096 ? '✓' : '✗ НЕ ВЛЕЗАЕТ'}`);

for (const [name, mixes] of [['обычные', typical], ['тяжёлые', heavy]]) {
  const st = packState(mixes, { contact: "@vektor_sigma_manager", note: "Catmint сейчас нет в наличии — собрал похожие по вкусу", rev: 12 });
  const c = JSON.parse(st.chat_data), pb = JSON.parse(st.public_data);
  console.log(`${name}: составы ${Buffer.byteLength(st.chat_data)} из 1024 байт (линейка: «${c.m[0].p[0][2]}»), тексты ${Buffer.byteLength(st.public_data)} из 1024 (описания по ${(pb.d || []).map((d) => d.length).join(' / ') || 0} знаков)`);
  console.log(`подпись (${name}): ${caption(mixes).length} символов`);
}
