import { useEffect, useRef, useState } from 'preact/hooks';

// Ruling L-6 (2026-09-24): o pedido de piloto vai para o WhatsApp do Felipe.
// Este formulário NÃO envia nada a servidor nenhum — ele só monta a mensagem e
// abre o WhatsApp do próprio visitante, que decide se envia.
interface Props { numero: string; responsavel: string }

type Campo = 'nome' | 'clinica' | 'cidade' | 'vets';
const OPCOES_VETS = ['1', '2 a 3', '4 a 5', '6 ou mais'];
const ROTULO: Record<Campo, string> = {
  nome: 'Seu nome',
  clinica: 'Nome da clínica',
  cidade: 'Cidade',
  vets: 'Quantos veterinários atendem na clínica',
};

export function montarMensagem(d: Record<string, string>): string {
  const linhas = [
    'Olá! Quero saber do piloto do KURA para a minha clínica.',
    `Nome: ${d.nome}`,
    `Clínica: ${d.clinica}`,
    `Cidade: ${d.cidade}`,
    `Veterinários: ${d.vets}`,
  ];
  if (d.sistema) linhas.push(`Sistema que usa hoje: ${d.sistema}`);
  return linhas.join('\n');
}

export default function FormPiloto({ numero, responsavel }: Props) {
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [link, setLink] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  // Antes da hidratação o formulário seria enviado como GET nativo e a página
  // recarregaria perdendo o que foi digitado. O botão só liga depois do JS.
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);

  function enviar(e: Event) {
    e.preventDefault();
    const fd = new FormData(form.current!);
    const d = Object.fromEntries(
      ['nome', 'clinica', 'cidade', 'vets', 'sistema'].map((k) => [k, String(fd.get(k) ?? '').trim()]),
    );
    const novos: Partial<Record<Campo, string>> = {};
    const faltando: Record<'nome' | 'clinica' | 'cidade', string> = {
      nome: 'Preencha o seu nome.',
      clinica: 'Preencha o nome da clínica.',
      cidade: 'Preencha a cidade.',
    };
    (['nome', 'clinica', 'cidade'] as const).forEach((k) => {
      if (!d[k]) novos[k] = faltando[k];
    });
    if (!d.vets) novos.vets = 'Escolha quantos veterinários atendem na clínica.';
    setErros(novos);
    const primeiro = Object.keys(novos)[0];
    if (primeiro) {
      form.current!.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(montarMensagem(d))}`;
    setLink(url);
    window.open(url, '_blank', 'noopener');
  }

  const campo = (k: Campo, auto: string) => (
    <div class="f-campo">
      <label for={`f-${k}`}>{ROTULO[k]}</label>
      <input
        id={`f-${k}`}
        name={k}
        type="text"
        autocomplete={auto}
        aria-invalid={erros[k] ? 'true' : undefined}
        aria-describedby={erros[k] ? `f-${k}-erro` : undefined}
      />
      {erros[k] && <p id={`f-${k}-erro`} class="f-erro">{erros[k]}</p>}
    </div>
  );

  return (
    <form ref={form} class="f" onSubmit={enviar} noValidate action="#piloto">
      {campo('nome', 'name')}
      {campo('clinica', 'organization')}
      {campo('cidade', 'address-level2')}
      <fieldset class="f-campo" aria-describedby={erros.vets ? 'f-vets-erro' : undefined}>
        <legend>{ROTULO.vets}</legend>
        <div class="f-opcoes">
          {OPCOES_VETS.map((o, i) => (
            <label class="f-opcao">
              <input type="radio" name="vets" value={o} aria-invalid={erros.vets && i === 0 ? 'true' : undefined} />
              <span>{o}</span>
            </label>
          ))}
        </div>
        {erros.vets && <p id="f-vets-erro" class="f-erro">{erros.vets}</p>}
      </fieldset>
      <div class="f-campo">
        <label for="f-sistema">Sistema que usa hoje <span class="f-opc">(opcional)</span></label>
        <input id="f-sistema" name="sistema" type="text" />
      </div>
      <button class="btn btn-primary" type="submit" disabled={!pronto}>Abrir o WhatsApp com a mensagem pronta</button>
      <p class="f-aviso">
        Este site não guarda o que você escreve. O botão abre o seu WhatsApp com a
        mensagem montada para {responsavel}, e você decide se envia.
      </p>
      <div role="status" class="f-status">
        {link && (
          <p>
            Mensagem pronta no WhatsApp. Se ele não abriu,{' '}
            <a href={link} target="_blank" rel="noopener">toque aqui para abrir</a>.
          </p>
        )}
      </div>
    </form>
  );
}
