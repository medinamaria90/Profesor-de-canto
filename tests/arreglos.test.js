import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarArreglo, acordeVigente, compasesDeMelodia, colocarEnRegistro, tonoDeAcorde, ESTILOS } from '../js/musica/arreglos.js';

const ACORDES = [
  { compas: 0, grados: [0, 4, 7] },
  { compas: 1, pulso: 2, grados: [7, 11, 14] },
  { compas: 2, grados: [5, 9, 12] },
];

test('el acorde vigente respeta compás y pulso, y antes del primer compás suena el primero', () => {
  assert.deepEqual(acordeVigente(ACORDES, -1, 0).grados, [0, 4, 7]);
  assert.deepEqual(acordeVigente(ACORDES, 1, 1).grados, [0, 4, 7]);
  assert.deepEqual(acordeVigente(ACORDES, 1, 2).grados, [7, 11, 14]);
  assert.deepEqual(acordeVigente(ACORDES, 3, 0).grados, [5, 9, 12]);
});

test('el arreglo en bloque toca un acorde en cada pulso, con entrada de un compás y el primero más fuerte', () => {
  const arreglo = generarArreglo(ACORDES, 4, 'bloque', 4);
  const entrada = arreglo.acordes.filter((evento) => evento.pulso < 0);
  assert.equal(entrada.length, 4);
  assert.ok(entrada.every((evento) => evento.grados[0] === 0));
  const compasUno = arreglo.acordes.filter((evento) => evento.pulso >= 4 && evento.pulso < 8);
  assert.deepEqual(compasUno.map((evento) => evento.grados[0]), [0, 0, 7, 7]);
  assert.equal(compasUno[0].acento, 1);
  assert.ok(compasUno[1].acento < 1);
  assert.ok(arreglo.acordes.every((evento) => evento.pulso < 16));
  assert.equal(arreglo.bajo.find((evento) => evento.pulso === 0).grado, -12);
});

test('un vals lleva tres pulsos por compás y un estilo sin patrón de tres cae en bloque', () => {
  const vals = generarArreglo(ACORDES, 2, 'bloque', 3);
  assert.equal(vals.acordes.filter((evento) => evento.pulso >= 0 && evento.pulso < 3).length, ESTILOS.bloque[3].teclas.length);
  assert.equal(generarArreglo(ACORDES, 1, 'swing', 3).acordes.length, generarArreglo(ACORDES, 1, 'bloque', 3).acordes.length);
  assert.equal(generarArreglo(ACORDES, 1, 'inexistente').acordes.length, generarArreglo(ACORDES, 1, 'bloque').acordes.length);
});

test('las notas del acorde se extienden por octavas y el acorde se coloca en su registro sin cambiar de forma', () => {
  assert.equal(tonoDeAcorde([0, 4, 7], 3), 12);
  assert.equal(tonoDeAcorde([0, 4, 7], 4), 16);
  assert.deepEqual(colocarEnRegistro([72, 76, 79], 52, 63), [60, 64, 67]);
  assert.deepEqual(colocarEnRegistro([41, 45, 48], 52, 63), [53, 57, 60]);
  assert.deepEqual(colocarEnRegistro([-7], 36, 47), [41]);
});

test('los compases de una melodía descuentan la anacrusa', () => {
  assert.equal(compasesDeMelodia([[0, 2], [2, 2], [4, 3], [5, 1]]), 2);
  assert.equal(compasesDeMelodia([[0, 1]]), 1);
  assert.equal(compasesDeMelodia([[0, 1], [0, 3], [0, 3]], 3, 1), 2);
});
