# kura-landing

Landing page B2B do KURA para clínicas veterinárias. Objetivo único: **pedido de vaga no piloto**
(R$ 149/mês por 90 dias, 5 vagas). O plano, as decisões e o backlog estão em
`WorkSpace-VsClaude/KURA_LANDING_PAGE_PLANO.md` (repo de planejamento, privado).

- **Stack:** Astro 7 (estático) + ilhas Preact (simulador da Luna, calculadora, formulário).
- **Sem backend.** O formulário só monta a mensagem e abre o WhatsApp do próprio visitante
  (`wa.me`). O site não grava nada, não usa cookies e não tem banco.
- **Hospedagem:** Cloudflare Workers (Static Assets), plano grátis, em `*.workers.dev`. Não há
  domínio próprio até a primeira clínica pagante.

## Rodar

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # gera dist/ e roda o detector de afirmações proibidas
npm test             # testes unitários (calculadora)
npx astro check      # type-check
```

## Regras que não podem ser quebradas

1. **Nenhum número ou promessa sem fonte.** Toda afirmação vem da matriz do §0.3 do plano.
   `scripts/check-claims.mjs` roda no build com um padrão por **classe** de afirmação proibida
   (tração, receita, avaliação, acurácia, certificação, LGPD, iOS, isolamento entre clínicas,
   diagnóstico, oferta, fiscal, infra, migração, lembrete de vacina, selo de terceiro). É uma
   **lista de padrões, não um leitor de sentido**: uma redação nova pode escapar. Por isso toda
   frase nova com número ou promessa também passa pela matriz §0.3 do plano. Depois de editar a
   lista, rode `npm run check:claims:selftest` (48 iscas + 10 frases honestas que não podem disparar).
2. **O simulador da Luna não é escrito à mão.** `src/data/luna-cenarios.json` sai do motor real:

   ```bash
   cd ../kura-luna-ai/luna
   PYTHONIOENCODING=utf-8 PYTHONPATH=. python ../../kura-landing/scripts/gerar-cenarios-luna.py
   ```

   A resposta sai de `InboundMessageService._compor_resposta` (tutor cadastrado, 1 pet), a mesma
   função da produção. O JSON grava o commit da Luna que o produziu. Se as regras mudarem, regenere.
3. **Tokens da marca** em `src/styles/tokens.css` são cópia literal de `Kura/kura-tokens.css`
   (o cabeçalho tem o comando que confere). Ajustes de contraste ficam em `global.css`.
4. **Logo oficial = `KuraMark` (semente)**, em sage, sem distorcer a proporção 5:6.

## Publicar (precisa da conta Cloudflare do Felipe)

```bash
npx wrangler login     # abre o navegador; conta Cloudflare grátis
npm run build
npx wrangler deploy    # publica em kura-landing.<conta>.workers.dev
```

## Estado medido (2026-09-25, máquina local)

| Verificação | Resultado |
|---|---|
| `astro check` | 0 erros |
| `npm test` | 2/2 (mutação na fórmula ⇒ 1 falha, ou seja, o teste morde) |
| Detector de afirmações | self-test 48/48 iscas (inclui as 38 variantes da G2) e 10/10 frases honestas sem alarme; `dist/` com 0 achados; o protótipo antigo dispara 10 categorias |
| axe-core (WCAG 2.2 AA + boas práticas) | 0 violações, excluindo o logotipo (isento pelo 1.4.3) |
| Lighthouse 13.5, mobile | Performance 98 · Acessibilidade 96 · Boas práticas 100 · SEO 100 · LCP 2,0 s · CLS 0,014 · 148 KiB |
| Formulário | validação, foco no 1º erro, URL `wa.me` correta, botão desabilitado antes da hidratação |

Não verificado: Safari/iOS e Android em aparelho real; o workflow de CI nunca rodou (o repo
ainda não tem remoto).
