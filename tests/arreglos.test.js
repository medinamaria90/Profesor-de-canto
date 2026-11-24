import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarArreglo, acordeEnCompas, compasesDeMelodia, colocarEnRegistro, tonoDeAcorde, ESTILOS, PULSOS_POR_COMPAS } from '../js/musica/arreglos.js';

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
  assert.equal(arreglo.bajo.filter((evento) => evento.pulso < PULSOS_POR_COMPAS).length, ESTILOS.pop.bajo.length);
  assert.equal(arreglo.bajo[0].grado, -12);
});

test('el arreglo puede empezar en un compás intermedio con pulsos relativos', () => {
  const arreglo = generarArreglo(ACORDES, 1, 'balada', 2);
  assert.equal(arreglo.acordes[0].pulso, 0);
  assert.deepEqual(arreglo.cuerdas[0].grados, [5, 9, 12]);
  // La balada arpegia: cada evento del piano es una nota del acorde, con la fundamental una octava arriba al final.
  assert.ok(arreglo.acordes.every((evento) => evento.grados.length === 1));
  assert.ok(arreglo.acordes.some((evento) => evento.grados[0] === 17));
});

test('las notas del acorde se extienden por octavas y el acorde se coloca en su registro sin cambiar de forma', () => {
  assert.equal(tonoDeAcorde([0, 4, 7], 3), 12);
  assert.equal(tonoDeAcorde([0, 4, 7], 4), 16);
  assert.deepEqual(colocarEnRegistro([72, 76, 79], 52, 63), [60, 64, 67]);
  assert.deepEqual(colocarEnRegistro([41, 45, 48], 52, 63), [53, 57, 60]);
  assert.deepEqual(colocarEnRegistro([-7], 36, 47), [41]);
});

test('un estilo desconocido cae en pop y los compases se calculan por pulsos', () => {
  assert.deepEqual(generarArreglo(ACORDES, 1, 'inexistente').percusion.length, generarArreglo(ACORDES, 1, 'pop').percusion.length);
  assert.equal(compasesDeMelodia([[0, 2], [2, 2], [4, 3], [5, 1]]), 2);
  assert.equal(compasesDeMelodia([[0, 1]]), 1);
});
