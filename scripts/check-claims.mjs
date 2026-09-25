// Detector de afirmações proibidas (LP-NFR-07). Falha o build se o HTML
// publicado contiver promessa que o KURA não sustenta. A vitrine pública deste
// projeto já publicou tração e certificação inventadas uma vez (CLAUDE.md,
// pendência de 19/09); esta lista existe para isso não voltar em silêncio.
//
// Uso:  node scripts/check-claims.mjs dist      (varre o build)
//       node scripts/check-claims.mjs --selftest (controle positivo)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Detector de TERMOS-ÂNCORA inequívocos, não de sentido. Histórico, para não
// repetir: a 1ª versão listava frases do protótipo (pegou 4/38 paráfrases, G2);
// a 2ª tentou cobrir cada classe com regex e decorou as iscas (0/30 paráfrases
// novas e alarme falso em 16/16 frases honestas, re-G2 de 2026-09-25). Regex não
// vence paráfrase. A proteção real é a matriz §0.3 do plano; isto aqui só pega o
// termo que nunca tem uso honesto nesta página, e ignora frase negativa
// ("não", "nunca", "nenhum", "ainda não").
export const PROIBIDOS = [
  { re: /ISO(\s*\/\s*IEC)?\s*27\.?001|\bSOC\s*2\b/i, por: 'certificação de segurança inexistente' },
  { re: /ICP-?Brasil|certificado A[13]\b/i, por: 'assinatura qualificada não existe no produto' },
  { re: /ANVISA|Portaria\s*344|SNGPC/i, por: 'controle regulatório não implementado' },
  { re: /(aprovad|homologad|certificad|recomendad|selecionad)[oa]s?\s+(pel[oa]|no|na)\s+(CFMV|CRMV|FIAP|NEXT)/i, por: 'aprovação de terceiro sem documento' },
  { re: /clyvo/i, por: 'marca de terceiro sem acordo escrito' },
  { re: /\bAWS\b|Amazon Web Services|Google Cloud|\bAzure\b/i, por: 'infraestrutura não se anuncia sem medição' },
  { re: /\bNPS\b|★|\bMRR\b|\bARR\b/i, por: 'métrica de tração/avaliação inexistente' },
  { re: /\d+([.,]\d+)?\s*%/, por: 'percentual sem fonte (a página não tem nenhum medido)' },
  { re: /\b\d[\d.]*\s*\+?\s*(mil\s+)?(cl[ií]nicas|tutores|pets|usu[aá]rios)\b(?!\s+piloto)/i, por: 'contagem de clínicas/tutores: o KURA tem 0 clientes' },
  { re: /\b(iPhone|iPad|iOS)\b|App Store|Play Store/, por: 'loja/iOS não publicado nem testado' },
  { re: /\bPix\b|gr[aá]tis|sem custo|sem fidelidade|sem multa/i, por: 'oferta ou pagamento que o produto/contrato não prevê' },
  { re: /lembrete|vacina vencer/i, por: 'lembrete de vacina não funciona sem SQL manual (E31/E38)' },
];

const NEGACAO = /\b(n[aã]o|nunca|nenhum|nenhuma|ainda n[aã]o)\b/i;

export function varrer(texto) {
  // Só o texto que o visitante lê (fora <script>/<style>), mais o conteúdo das
  // <meta> (description/og), que também é afirmação pública.
  const metas = [...texto.matchAll(/<meta[^>]+content="([^"]*)"/gi)].map((m) => m[1]).join('\n');
  const plano = texto.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, '\n') + '\n' + metas;
  const frases = plano.split(/(?<=[.!?])\s+|\n+/).map((f) => f.trim()).filter(Boolean);
  const achados = [];
  for (const f of frases) {
    if (NEGACAO.test(f)) continue;
    for (const p of PROIBIDOS) {
      const m = f.match(p.re);
      if (m) achados.push({ padrao: String(p.re), por: p.por, trecho: f.slice(0, 120) });
    }
  }
  return achados;
}

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : /\.html$/.test(n) ? [p] : [];
  });
}

if (process.argv.includes('--selftest')) {
  // Controle positivo: cada um destes TEM que ser pego, senão um "0 achados"
  // no build não prova nada (regra de ouro do projeto).
  // Iscas: só termo-âncora. Paráfrase ("A Luna identifica emergências com
  // segurança") NÃO é pega, de propósito: isso é trabalho da matriz §0.3.
  const iscas = [
    'ISO 27001', 'Certificado ISO/IEC 27001', 'Selo de segurança SOC 2', 'Receita com assinatura ICP-Brasil',
    'Controle ANVISA incluído', 'Aprovado pelo CFMV', 'Homologado pelo CRMV-SP', 'Aprovado pela FIAP',
    'Selecionado pelo NEXT FIAP 2026', 'Parceiro oficial Clyvo Vet', 'invest@clyvovet.com.br',
    'Hospedado na AWS', 'Servidores no Google Cloud', '98% NPS', 'Nota 4,8 ★', 'R$ 450K MRR',
    'Luna com 94% acurácia', 'A Luna reconhece 99% das emergências', 'Dados 100% protegidos pela LGPD',
    'Disponibilidade de 99,9%', 'Mais de 120 clínicas veterinárias já usam Kura', 'Mais de 300 pets triados por mês',
    'Já são 40 clínicas na lista de espera', '15.000 tutores cadastrados', 'Disponível na App Store',
    'App para iOS e Android', 'Pagamento por Pix integrado', 'Teste grátis por 14 dias', 'Primeiro mês sem custo',
    'Cancele quando quiser, sem multa', 'Lembrete de vacina automático',
  ];
  // Controle negativo: as 16 frases honestas da re-G2 (que a 2ª versão punia) + frases da página.
  const honestas = [
    'A precisão do horário depende do cadastro da clínica.', 'Sem migração: o KURA roda ao lado do seu sistema.',
    'Não fazemos migração de dados.', 'Você não precisa baixar nada na App Store.', 'O KURA ainda não tem MRR.',
    'Veterinários usam o prontuário por voz durante a consulta.', 'Clínicas usando o piloto falam direto com o time.',
    'Tutores cadastrados na clínica recebem resposta com o nome do pet.',
    'Clínicas no Brasil que atendem até tarde recebem mensagens de madrugada.',
    'O piloto não é grátis: custa R$ 149 por mês.', 'Não existe teste de 30 dias.',
    'Clínicas de Manaus, Amazonas, também podem participar.', 'iOS ainda não testado.',
    'A Luna não faz diagnóstico por imagem.', 'Sua clínica emite nota no sistema que já usa.',
    'Cada prontuário fica isolado por paciente.',
    'No iPhone ainda não testamos, então não prometemos.', 'Quantas clínicas usam o KURA hoje?',
    'Nenhuma pagante ainda.', 'Quer ser uma das 5 clínicas piloto?', 'Para clínicas de 1 a 2 veterinários',
    'Nos casos que a Resolução CFMV 1.465/2022 permite.', 'o KURA vai estar como expositor.',
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
