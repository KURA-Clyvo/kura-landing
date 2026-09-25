import { useState } from 'preact/hooks';
import { custoPorMensagem, formatarReal } from '../lib/whatsapp';

interface Props { precoMensagem: number; precoClinica: number }

export default function CalculadoraWhatsApp({ precoMensagem, precoClinica }: Props) {
  const [msgs, setMsgs] = useState(350);
  const extra = custoPorMensagem(msgs, precoMensagem);
  return (
    <div class="calc">
      <label for="calc-msgs" class="calc-label">
        Quantas mensagens a clínica troca com tutores por mês?
      </label>
      <div class="calc-linha">
        <input
          id="calc-msgs"
          type="range"
          min={0}
          max={1000}
          step={10}
          value={msgs}
          onInput={(e) => setMsgs(Number((e.target as HTMLInputElement).value))}
        />
        <output for="calc-msgs" class="calc-num">{msgs}</output>
      </div>
      <dl class="calc-res">
        <div>
          <dt>Sistemas que cobram {precoMensagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mensagem</dt>
          <dd>+ {formatarReal(extra)} por mês</dd>
        </div>
        <div class="kura">
          <dt>No plano Clínica do KURA ({formatarReal(precoClinica)} por mês)</dt>
          <dd>Incluso</dd>
        </div>
      </dl>
    </div>
  );
}
