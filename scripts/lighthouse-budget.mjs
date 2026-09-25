// Orçamento de LP-NFR-01. Falha o CI se qualquer categoria cair abaixo do mínimo.
// Acessibilidade fica em 95, e não em 100, por um motivo só: o "ra" em amber
// do logotipo (2,85:1) é isento pelo WCAG 1.4.3 (logotipos), mas o Lighthouse
// não sabe disso e desconta. Qualquer OUTRA falha de contraste derruba abaixo de 95.
import { readFileSync } from 'node:fs';

const MINIMO = { performance: 95, accessibility: 95, 'best-practices': 100, seo: 100 };
const r = JSON.parse(readFileSync(process.argv[2] || 'lh.json', 'utf8'));
if (r.runtimeError) { console.error('lighthouse falhou:', r.runtimeError); process.exit(2); }
let ok = true;
for (const [cat, min] of Object.entries(MINIMO)) {
  const nota = Math.round((r.categories[cat]?.score ?? 0) * 100);
  const passou = nota >= min;
  ok &&= passou;
  console.log(`${passou ? 'ok  ' : 'FAIL'} ${cat}: ${nota} (mínimo ${min})`);
}
const contraste = r.audits['color-contrast']?.details?.items ?? [];
const foraDoLogo = contraste.filter((i) => !i.node.selector.includes('span.word'));
if (foraDoLogo.length) {
  ok = false;
  for (const i of foraDoLogo) console.log(`FAIL contraste fora do logotipo: ${i.node.selector}`);
}
process.exit(ok ? 0 : 1);
