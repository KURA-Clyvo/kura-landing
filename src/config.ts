// Contato que recebe os pedidos de piloto (ruling L-6, 2026-09-24): WhatsApp
// pessoal do Felipe Ferrete. O formulário só MONTA a mensagem; quem envia é o
// visitante, pelo próprio WhatsApp. Nada é gravado por este site.
export const WHATSAPP_PILOTO = '5511972497897';
export const RESPONSAVEL = 'Felipe Ferrete';

// Números públicos da página. Cada um tem fonte; mudar aqui exige mudar a
// fonte citada em KURA_LANDING_PAGE_PLANO.md §0.3.
export const PRECOS = {
  essencial: 279, // KURA_PLANO_FINANCEIRO.md §2.3
  clinica: 489,
  rede: 890,
  piloto: 149,
  pilotoDias: 90,
  vagasPiloto: 5,
  custoMensagemReferencia: 0.5, // preço por mensagem cobrado como adicional no mercado, §2.2
};

export function linkWhatsApp(texto: string): string {
  return `https://wa.me/${WHATSAPP_PILOTO}?text=${encodeURIComponent(texto)}`;
}
