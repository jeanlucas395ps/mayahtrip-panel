import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navegacao = readFileSync(new URL('../src/app/navegacao.ts', import.meta.url), 'utf8');
const textos = readFileSync(new URL('../src/app/textos.ts', import.meta.url), 'utf8');
const html = readFileSync(new URL('../src/app/app.html', import.meta.url), 'utf8');
const aplicacao = readFileSync(new URL('../src/app/app.ts', import.meta.url), 'utf8');

const telas = [...navegacao.matchAll(/itens: \[([^\]]+)\]/g)].flatMap((achado) => [...achado[1].matchAll(/'([a-z]+)'/g)].map((item) => item[1]));
const grupos = [...navegacao.matchAll(/titulo: '([^']+)'/g)].map((achado) => achado[1]);
const locais = textos.split(/'pt-PT':|'en':|'es':/).map((bloco) => bloco);

test('cada tela do menu existe nos quatro idiomas e na página', () => {
  assert.equal(new Set(telas).size, telas.length);
  assert.ok(telas.includes('inicio'));
  assert.ok(telas.includes('hub'));
  for (const tela of telas) {
    assert.match(html, new RegExp(`tela\\(\\) === '${tela}'`));
    assert.match(aplicacao, new RegExp(`${tela}: \\(\\) =>`));
    for (const bloco of locais) {
      assert.match(bloco, new RegExp(`${tela}: '`));
    }
  }
  for (const grupo of grupos) {
    for (const bloco of locais) {
      assert.match(bloco, new RegExp(`${grupo}: '`));
    }
  }
});
