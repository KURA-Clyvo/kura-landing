// Detector de afirmações proibidas (LP-NFR-07). Falha o build se o HTML
// publicado contiver promessa que o KURA não sustenta. A vitrine pública deste
// projeto já publicou tração e certificação inventadas uma vez (CLAUDE.md,
// pendência de 19/09); esta lista existe para isso não voltar em silêncio.
//
// Uso:  node scripts/check-claims.mjs dist      (varre o build)
//       node scripts/check-claims.mjs --selftest (controle positivo)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Um padrão por CLASSE de afirmação da matriz §0.3 do plano, não por frase.
// A 1ª versão listava as frases do protótipo antigo e deixava passar 34 de 38
// variantes plausíveis (G2 da landing, 2026-09-25). As variantes viraram iscas
// permanentes no --selftest abaixo.
export const PROIBIDOS = [
  { re: /ISO(\s*\/\s*IEC)?\s*27\.?001|certifica(do|ção|cao)\s+(ISO|digital|A1|A3|ICP)|certificado A[13]\b|ICP-?Brasil|assinatura digital (com certificado|v[aá]lida)/i, por: 'certificação/assinatura qualificada inexistente' },
  { re: /ANVISA|Portaria\s*344|SNGPC/i, por: 'controle regulatório não implementado' },
  { re: /acur[aá]cia|precis[aã]o|taxa de acerto|acerta\s+\d|\d+\s*% de acerto/i, por: 'não há conjunto de avaliação que sustente acurácia' },
  { re: /(cl[ií]nicas|tutores|usu[aá]rios|veterin[aá]rios)[^.<?]{0,30}\b(usam|usando|atendid|cadastrad|ativos|no brasil|parceir|confiam)|usad[oa] por (cl[ií]nicas|veterin)|em \d+ estados|j[aá] usam o kura|confiam no kura|clientes satisfeitos/i, por: 'tração/número de cliente: o KURA tem 0 clientes pagantes' },
  { re: /receita recorrente|\bMRR\b|\bARR\b|faturamento de R\$/i, por: 'receita inexistente' },
  { re: /★|\d[,.]\d\s*(\/\s*5|estrelas|na (app|play))|\bNPS\b|\d+\s*% de satisfa|Play Store/i, por: 'avaliação de loja inexistente' },
  { re: /\b(iPhone|iOS|iPad)\b(?![^<]{0,80}(n[aã]o testamos|n[aã]o prometemos))|App Store/, por: 'iOS nunca foi verificado' },
  { re: /isolad[oa]s?\b|isolamento (total|completo)|s[óo] v[eê] (os )?(pr[óo]prios|seus) dados|nenhuma cl[ií]nica (v[eê]|enxerga|acessa)/i, por: 'vazamento cross-tenant A6 ainda aberto' },
  { re: /LGPD compliant|certificad[oa] (pela|na) LGPD|100% LGPD|conformidade com a LGPD|adequad[oa] [àa] LGPD/i, por: 'LGPD não certifica; adequação não foi auditada' },
  { re: /aprovad[oa] pel[oa] (FIAP|NEXT)|selecionad[oa] (pel[oa]|para o|no) (FIAP|NEXT)|parceir[oa] oficial|Clyvo/i, por: 'selo, aprovação ou parceria sem documento' },
  { re: /\b(Luna|a IA|o KURA)\s+diagnostica|diagn[óo]stico (por|com|feito pela|autom[aá]tico)/i, por: 'a Luna não diagnostica' },
  { re: /\bgr[aá]tis\b|sem fidelidade|teste de \d+ dias/i, por: 'oferta que o contrato não prevê' },
  { re: /nota fiscal (inclu[ií]da|integrada)|(?<!n[aã]o )emite nota/i, por: 'não há módulo fiscal' },
  { re: /\bAWS\b|Amazon/i, por: 'a infraestrutura não é AWS' },
  { re: /migra[cç][aã]o|importamos (os )?(seus )?dados|importa[cç][aã]o (completa|de dados)/i, por: 'não existe importador de dados' },
  { re: /lembrete (de|para) vacina|lembrete autom[aá]tico/i, por: 'lembrete de vacina não funciona sem SQL manual (G2 achado 1)' },
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
    // protótipo antigo
    'Mais de 120 clínicas veterinárias já usam Kura', 'Luna com 94% acurácia', 'Receita com assinatura ICP-Brasil',
    'ISO 27001', 'backup em três regiões AWS', 'migração em 48h', 'app nativo para iPad/iPhone', '4,8 ★',
    'isolamento total entre clínicas', 'invest@clyvovet.com.br',
    // as 38 variantes da G2 (g2-landing.md, M9)
    'Mais de cem clínicas usam o KURA', '120+ clínicas no Brasil', '15.000 tutores cadastrados',
    '15 mil tutores atendidos pela Luna', 'Usado por clínicas em 12 estados', 'R$ 450 mil de receita recorrente',
    'Nota 4.8 na App Store', 'Avaliação 4,8/5 na Play Store', '98% de satisfação',
    'Luna acerta 94% das triagens', '94% de precisão na triagem', 'Taxa de acerto de 94%', 'Detecta urgências com precisão',
    'Certificado ISO/IEC 27001', 'Certificação ISO 27.001', 'Em conformidade com a LGPD', 'Totalmente adequado à LGPD',
    'Assinatura digital com certificado A1 e A3', 'Receita com assinatura digital válida juridicamente',
    'Disponível na App Store', 'App para iOS e Android',
    'Dados 100% isolados entre clínicas', 'Cada clínica só vê os próprios dados',
    'Aprovado pela FIAP', 'Selecionado pelo NEXT FIAP 2026', 'Parceiro oficial Clyvo Vet',
    'Diagnóstico por IA', 'A Luna diagnostica o seu pet',
    'Teste grátis por 14 dias', 'Sem fidelidade', 'Emissão de nota fiscal incluída',
    'Infra em nuvem da Amazon', 'Migração dos seus dados em 2 dias', 'Importamos os dados do SimplesVet',
    'Clientes satisfeitos', 'ANVISA', 'Hospedado na AWS', 'Lembrete de vacina automático para o tutor',
  ];
  // Controle negativo: frases honestas que a página usa e que NÃO podem disparar.
  const honestas = [
    'No iPhone ainda não testamos, então não prometemos.', 'Ela não diagnostica.',
    'Quem diagnostica é o veterinário.', 'O KURA não emite nota.', 'O KURA já tem clientes?',
    'Nenhuma pagante ainda.', 'Para clínicas de 1 a 2 veterinários', 'Quer ser uma das 5 clínicas piloto?',
    'o KURA vai estar como expositor.', 'Não incluso em nenhum plano: emissão de nota fiscal e pagamentos.',
  ];
  const falhas = iscas.filter((i) => varrer(i).length === 0);
  for (const h of honestas) if (varrer(h).length) falhas.push(`falso positivo: "${h}"`);
  if (falhas.length) { console.error('SELFTEST FALHOU, detector cego para:', falhas); process.exit(1); }
  console.log(`selftest ok: ${iscas.length}/${iscas.length} iscas pegas, ${honestas.length}/${honestas.length} frases honestas sem alarme`);
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
