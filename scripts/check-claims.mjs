// Detector de afirmações proibidas (LP-NFR-07). Falha o build se o HTML
// publicado contiver promessa que o KURA não sustenta. A vitrine pública deste
// projeto já publicou tração e certificação inventadas uma vez (CLAUDE.md,
// pendência de 19/09); esta lista existe para isso não voltar em silêncio.
//
// Uso:  node scripts/check-claims.mjs dist      (varre o build)
//       node scripts/check-claims.mjs --selftest (controle positivo)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const PROIBIDOS = [
  { re: /ISO\s*27001/i, por: 'certificação inexistente' },
  { re: /ICP-?Brasil/i, por: 'assinatura qualificada não existe no produto' },
  { re: /ANVISA|Portaria\s*344|SNGPC/i, por: 'controle regulatório não implementado' },
  { re: /acur[aá]cia|precis[aã]o de \d/i, por: 'não há conjunto de avaliação que sustente acurácia' },
  { re: /\d[\d.]*\s*\+?\s*(cl[ií]nicas|tutores|usu[aá]rios)(\s+[\wÀ-ú]+){0,3}?\s+(parceir|ativ|j[aá] usa|confiam|atendid)/i, por: 'número de cliente: o KURA tem 0 clientes pagantes' },
  { re: /j[aá] usam o kura|confiam no kura|clientes satisfeitos/i, por: 'prova social inexistente' },
  { re: /★|estrelas na (app store|play store)|\bNPS\b/i, por: 'avaliação de loja inexistente' },
  { re: /\bAWS\b|Amazon Web Services/i, por: 'a infraestrutura não é AWS' },
  { re: /migra[cç][aã]o (gratuita |completa )?em \d+\s*h/i, por: 'não existe importador de dados' },
  { re: /\biPhone\b(?![^<]{0,80}(n[aã]o testamos|n[aã]o prometemos))/i, por: 'iOS nunca foi verificado' },
  { re: /(isolamento|isolad[oa]s?) (total|completo)|nenhuma cl[ií]nica (v[eê]|enxerga)/i, por: 'vazamento cross-tenant A6 ainda aberto' },
  { re: /LGPD compliant|certificad[oa] (pela|na) LGPD|100% LGPD/i, por: 'LGPD não certifica' },
  { re: /clyvovet\.com\.br|clyvo\.com\.br/i, por: 'domínio de terceiro que não resolve' },
];

export function varrer(texto) {
  const plano = texto.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return PROIBIDOS.filter((p) => p.re.test(plano) || p.re.test(texto)).map((p) => ({ padrao: String(p.re), por: p.por, trecho: (plano.match(p.re) || texto.match(p.re) || [''])[0] }));
}

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : /\.(html|js|json|txt|xml)$/.test(n) ? [p] : [];
  });
}

if (process.argv.includes('--selftest')) {
  // Controle positivo: cada um destes TEM que ser pego, senão um "0 achados"
  // no build não prova nada (regra de ouro do projeto).
  const iscas = [
    'Mais de 120 clínicas veterinárias já usam Kura',
    'Luna com 94% acurácia', 'Receita com assinatura ICP-Brasil', 'ISO 27001',
    'backup em três regiões AWS', 'migração em 48h', 'app nativo para iPad/iPhone', '4,8 ★',
    'isolamento total entre clínicas', 'invest@clyvovet.com.br',
  ];
  const falhas = iscas.filter((i) => varrer(i).length === 0);
  const limpo = 'No iPhone ainda não testamos, então não prometemos.';
  if (varrer(limpo).length) falhas.push(`falso positivo: "${limpo}"`);
  if (falhas.length) { console.error('SELFTEST FALHOU, detector cego para:', falhas); process.exit(1); }
  console.log(`selftest ok: ${iscas.length}/${iscas.length} iscas pegas, 0 falso positivo`);
  process.exit(0);
}

const alvo = process.argv[2] || 'dist';
const achados = arquivos(alvo).flatMap((f) => varrer(readFileSync(f, 'utf8')).map((a) => ({ arquivo: f, ...a })));
const total = arquivos(alvo).length;
if (!total) { console.error(`nenhum arquivo em ${alvo}: o build rodou?`); process.exit(2); }
if (achados.length) {
  for (const a of achados) console.error(`✗ ${a.arquivo}: "${a.trecho}" (${a.por})`);
  process.exit(1);
}
console.log(`check-claims ok: ${total} arquivos varridos, 0 afirmações proibidas`);
