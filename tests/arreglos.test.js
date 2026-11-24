import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarArreglo, acordeEnCompas, compasesDeMelodia, ESTILOS, PULSOS_POR_COMPAS } from '../js/musica/arreglos.js';

const ACORDES = [
  { compas: 0, grados: [0, 4, 7] },
  { compas: 2, grados: [5, 9, 12] },
];

test('el acorde vigente es el último definido hasta ese compás', () => {
  assert.deepEqual(acordeEnCompas(ACORDES, 0).grados, [0, 4, 7]);
  assert.deepEqual(acordeEnCompas(ACORDES, 1).grados, [0, 4, 7]);
  assert.deepEqual(acordeEnCompas(ACORDES, 3).grados, [5, 9, 12]);
});

test('el arreglo pop genera bajo, acordes y percusión en cada compás, dentro de la duración', () => {
  const arreglo = generarArreglo(ACORDES, 4, 'pop');
  const ultimoPulso = 4 * PULSOS_POR_COMPAS;
  for (const lista of [arreglo.bajo, arreglo.acordes, arreglo.percusion]) {
    assert.ok(lista.length > 0);
    assert.ok(lista.every((evento) => evento.pulso >= 0 && evento.pulso < ultimoPulso));
  }
  assert.equal(arreglo.bajo.filter((evento) => evento.pulso < PULSOS_POR_COMPAS).length, ESTILOS.pop.bajoPorPulso.filter(Boolean).length);
  assert.equal(arreglo.bajo[0].grado, -12);
});

test('el arreglo puede empezar en un compás intermedio con pulsos relativos', () => {
  const arreglo = generarArreglo(ACORDES, 1, 'balada', 2);
  assert.equal(arreglo.acordes[0].pulso, 0);
  assert.deepEqual(arreglo.acordes[0].grados, [5, 9, 12]);
});

test('un estilo desconocido cae en pop y los compases se calculan por pulsos', () => {
  assert.deepEqual(generarArreglo(ACORDES, 1, 'inexistente').percusion.length, generarArreglo(ACORDES, 1, 'pop').percusion.length);
  assert.equal(compasesDeMelodia([[0, 2], [2, 2], [4, 3], [5, 1]]), 2);
  assert.equal(compasesDeMelodia([[0, 1]]), 1);
});
