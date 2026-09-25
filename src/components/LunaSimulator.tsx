import { useEffect, useRef, useState } from 'preact/hooks';

// Os cenários vêm de src/data/luna-cenarios.json, gerado pelo motor REAL da
// Luna (scripts/gerar-cenarios-luna.py). Este componente só encena a conversa:
// nenhuma classificação, termo ou resposta é escrita aqui.
export interface Cenario {
  id: string;
  rotulo: string;
  pet: string;
  mensagem: string;
  urgencia: 'ALTA' | 'MEDIA' | 'BAIXA';
  sintomas: string[];
  resposta: string;
}

interface Props { cenarios: Cenario[]; regrasVersao: string; commit: string }

type Fase = 0 | 1 | 2 | 3; // 0 nada · 1 tutor · 2 luna · 3 fila

const NIVEL: Record<Cenario['urgencia'], string> = {
  ALTA: 'Alta urgência',
  MEDIA: 'Média urgência',
  BAIXA: 'Baixa urgência',
};

export default function LunaSimulator({ cenarios, regrasVersao, commit }: Props) {
  const [ativo, setAtivo] = useState(cenarios[0].id);
  const [fase, setFase] = useState<Fase>(3); // SSR e sem JS: conversa completa
  const timers = useRef<number[]>([]);
  // Sem anúncio automático ao carregar: o leitor de tela só acompanha a
  // conversa depois que a pessoa escolhe uma mensagem (G2 da landing, achado 12).
  const [interagiu, setInteragiu] = useState(false);
  const c = cenarios.find((x) => x.id === ativo) ?? cenarios[0];

  function tocar(id: string) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAtivo(id);
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduz) { setFase(3); return; }
    setFase(1);
    timers.current.push(window.setTimeout(() => setFase(2), 900));
    timers.current.push(window.setTimeout(() => setFase(3), 1900));
  }

  // O único movimento automático da página: a conversa se encena uma vez ao carregar.
  useEffect(() => {
    tocar(cenarios[0].id);
    return () => timers.current.forEach(clearTimeout);
  }, []);


  return (
    <div class="sim">
      <div class="sim-pick" role="group" aria-label="Escolha a mensagem do tutor">
        <span class="sim-pick-label">Teste uma mensagem</span>
        {cenarios.map((x) => (
          <button
            type="button"
            class="chip"
            aria-pressed={x.id === ativo}
            onClick={() => { setInteragiu(true); tocar(x.id); }}
          >
            {x.rotulo}
          </button>
        ))}
      </div>

      <div class="phone" aria-live={interagiu ? 'polite' : 'off'}>
        <div class="phone-top">
          <span class="dot" aria-hidden="true" />
          <span>WhatsApp do KURA</span>
          <span class="mute-sm">atendido pela Luna</span>
        </div>
        <div class="thread">
          <p class={`bubble tutor ${fase >= 1 ? 'on' : ''}`}>
            {c.mensagem}
            <time>23:14</time>
          </p>
          <p class={`typing ${fase === 1 ? 'on' : ''}`} aria-hidden="true">
            <span /><span /><span />
          </p>
          <p class={`bubble luna ${fase >= 2 ? 'on' : ''}`}>
            {c.resposta}
            <time>23:14</time>
          </p>
        </div>
      </div>

      <div class={`fila ${fase >= 3 ? 'on' : ''}`}>
        <div class="fila-head">
          <span>Fila da clínica</span>
          <span class="mute-sm">amanhã, 08:00</span>
        </div>
        <div class="fila-row">
          <span class={`nivel n-${c.urgencia.toLowerCase()}`}>{NIVEL[c.urgencia]}</span>
          <strong>{c.pet}</strong>
        </div>
        <p class="motivo">
          {c.sintomas.length ? (
            <>
              Registrado com a classificação:{' '}
              {c.sintomas.map((x) => <code>{x}</code>)}
            </>
          ) : (
            <>
              A Luna não reconheceu nenhum termo de urgência nesta mensagem.
              Mesmo assim, o tutor recebeu o critério de emergência. Essa
              orientação vai em toda resposta que não é de alta urgência.
            </>
          )}
        </p>
      </div>

      <p class="sim-note">
        Conversa encenada, com tutor cadastrado na clínica e um pet. A classificação, o
        registro e a resposta saem do código real da Luna (regras v{regrasVersao},
        versão {commit}).
      </p>
    </div>
  );
}
