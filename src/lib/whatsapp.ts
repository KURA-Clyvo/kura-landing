// Custo de WhatsApp cobrado por mensagem, para a calculadora da seção de preço.
// Fonte da comparação: KURA_PLANO_FINANCEIRO.md §2.2 (preço do adicional de
// WhatsApp lido na página do líder de mercado em 2026-09-10). A landing não
// nomeia o concorrente: preço de terceiro muda sem aviso.
export function custoPorMensagem(mensagens: number, precoMensagem: number): number {
  if (!Number.isFinite(mensagens) || mensagens < 0) return 0;
  return Math.round(mensagens * precoMensagem * 100) / 100;
}

export function formatarReal(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
