import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectarNotasCantadas, alinearNotas, puntuarPorNotas } from '../js/ejercicios/alineacion-notas.js';

const SEGMENTOS = [
  { indice: 0, inicio: 0, fin: 1, midi: 60 },
  { indice: 1, inicio: 1, fin: 2, midi: 62 },
  { indice: 2, inicio: 2, fin: 3, midi: 64 },
  { indice: 3, inicio: 3, fin: 4, midi: 62 },
];

// Simula una voz que canta la melodía con un retraso y una duración por nota propios.
function cantar(notas, { retraso = 0, duracionNota = 1, desvio = 0 }) {
  const muestras = [];
  let t = retraso;
  for (const midi of notas) {
    for (let k = 0; k < duracionNota; k += 0.03) muestras.push({ tiempo: t + k, midi: midi + desvio / 100 });
    t += duracionNota;
  }
  return muestras;
}

test('las lecturas se agrupan en notas cantadas ignorando deslices cortos', () => {
  const muestras = [...cantar([60], { duracionNota: 0.5 }), { tiempo: 0.52, midi: 61.5 }, ...cantar([64], { retraso: 0.6, duracionNota: 0.5 })];
  const notas = detectarNotasCantadas(muestras);
  assert.equal(notas.length, 2);
  assert.equal(Math.round(notas[0].midi), 60);
  assert.equal(Math.round(notas[1].midi), 64);
});

test('una melodía bien afinada pero con medio segundo de retraso y otro ritmo puntúa 100', () => {
  const muestras = cantar([60, 62, 64, 62], { retraso: 0.55, duracionNota: 0.7, desvio: 10 });
  const resultado = puntuarPorNotas(muestras, SEGMENTOS);
  assert.equal(resultado.puntuacion, 100);
  assert.equal(resultado.afinadas, 4);
  assert.equal(resultado.errorMedio, 10);
});

test('una nota mal cantada baja la puntuación y una nota que falta puntúa cero', () => {
  const desafinada = cantar([60, 62, 66, 62], { retraso: 0.3 });
  const resultado = puntuarPorNotas(desafinada, SEGMENTOS);
  assert.equal(resultado.porNota[2].puntuacion, 0);
  assert.equal(resultado.puntuacion, 75);
  const incompleta = cantar([60, 62, 64], { retraso: 0.3 });
  assert.equal(puntuarPorNotas(incompleta, SEGMENTOS).porNota[3].puntuacion, 0);
});

test('la alineación tolera notas de más (deslices) sin desplazar el resto', () => {
  const cantadas = [{ midi: 60 }, { midi: 61 }, { midi: 62 }, { midi: 64 }, { midi: 62 }];
  const emparejadas = alinearNotas(cantadas, SEGMENTOS);
  assert.deepEqual(emparejadas.map((nota) => nota?.midi), [60, 62, 64, 62]);
  assert.deepEqual(alinearNotas([], SEGMENTOS), [null, null, null, null]);
  assert.equal(puntuarPorNotas([], SEGMENTOS).puntuacion, 0);
});

test('dos notas objetivo iguales seguidas se dan por buenas aunque se canten ligadas como una sola', () => {
  const objetivos = [
    { indice: 0, midi: 60, inicio: 0, fin: 0.3 },
    { indice: 1, midi: 60, inicio: 0.3, fin: 0.6 },
    { indice: 2, midi: 62, inicio: 0.6, fin: 1.2 },
  ];
  const cantadas = [
    { midi: 60, inicio: 0.05, fin: 0.58 },
    { midi: 62, inicio: 0.65, fin: 1.15 },
  ];
  const emparejadas = alinearNotas(cantadas, objetivos);
  assert.equal(emparejadas[0]?.midi, 60);
  assert.equal(emparejadas[1]?.midi, 60);
  assert.equal(emparejadas[2]?.midi, 62);
});
