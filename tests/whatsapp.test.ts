import { test } from 'node:test';
import assert from 'node:assert/strict';
import { custoPorMensagem } from '../src/lib/whatsapp.ts';

// Os 6 pontos da tabela de KURA_PLANO_FINANCEIRO.md §2.2 (custo só do adicional).
const tabela: Array<[number, number]> = [
  [100, 50], [200, 100], [260, 130], [348, 174], [500, 250], [800, 400],
];

test('custo por mensagem bate com a tabela do plano financeiro', () => {
  for (const [msgs, esperado] of tabela) assert.equal(custoPorMensagem(msgs, 0.5), esperado);
});

test('entrada inválida vira zero, nunca NaN', () => {
  assert.equal(custoPorMensagem(-5, 0.5), 0);
  assert.equal(custoPorMensagem(Number.NaN, 0.5), 0);
});
