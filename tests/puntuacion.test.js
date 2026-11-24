import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puntuarMuestras, puntuarMuestrasTolerante, puntuarSirena, puntuarMelodia, calcularEstrellas, calificarResultado, creditoMuestra, estimarDesfase } from '../js/ejercicios/puntuacion.js';

test('muestras afinadas dan 100 y fuera de tolerancia dan 0', () => {
  assert.equal(puntuarMuestras([0, 10, -20, 49]).puntuacion, 100);
  assert.equal(puntuarMuestras([150, -200, 300]).puntuacion, 0);
  assert.equal(puntuarMuestras([]).puntuacion, 0);
});

test('la puntuación tolerante ignora el cuarto de muestras más desviado', () => {
  const muestras = [0, 5, -10, 20, 300, 400, 10, -15];
  assert.ok(puntuarMuestras(muestras).puntuacion < 80);
  assert.equal(puntuarMuestrasTolerante(muestras).puntuacion, 100);
  assert.equal(puntuarMuestrasTolerante([]).puntuacion, 0);
});

test('el crédito decrece linealmente entre 50 y 100 cents', () => {
  assert.equal(creditoMuestra(50), 1);
  assert.equal(creditoMuestra(75), 0.5);
  assert.equal(creditoMuestra(100), 0);
});

test('el error medio conserva el signo para dar consejo', () => {
  assert.equal(puntuarMuestras([30, 40, 50]).errorMedio, 40);
  assert.equal(puntuarMuestras([-30, -40]).errorMedio, -35);
});

test('sirena: siete semitonos es el máximo y debe subir de grave a agudo', () => {
  assert.equal(puntuarSirena([60, 62, 67]).puntuacion, 100);
  assert.equal(puntuarSirena([60, 61.5]).puntuacion, 21);
  assert.equal(puntuarSirena([60]).puntuacion, 0);
  const descendente = puntuarSirena([67, 65, 62, 60]);
  assert.equal(descendente.ascendente, false);
  assert.equal(descendente.puntuacion, 50);
});

test('el desfase estimado recupera el retraso con el que se cantó la melodía', () => {
  const segmentos = [
    { inicio: 0, fin: 1, midi: 60 },
    { inicio: 1, fin: 2, midi: 64 },
    { inicio: 2, fin: 3, midi: 67 },
  ];
  const retraso = 0.4;
  const muestras = [];
  for (let t = 0; t < 3; t += 0.05) {
    const segmento = segmentos.find((s) => t >= s.inicio && t < s.fin);
    muestras.push({ tiempo: t + retraso, midi: segmento.midi + 0.1 });
  }
  // La resolución del estimador es el paso de búsqueda (20 ms); se admite un paso y medio.
  assert.ok(Math.abs(estimarDesfase(muestras, segmentos) - retraso) <= 0.03);
  assert.equal(estimarDesfase([], segmentos), 0);
});

test('melodía es la media de sus notas', () => {
  assert.equal(puntuarMelodia([100, 50]), 75);
  assert.equal(puntuarMelodia([]), 0);
});

test('estrellas y calificación por umbrales', () => {
  assert.equal(calcularEstrellas(95), 3);
  assert.equal(calcularEstrellas(70), 2);
  assert.equal(calcularEstrellas(45), 1);
  assert.equal(calcularEstrellas(20), 0);
  assert.equal(calificarResultado(90), 'excelente');
  assert.equal(calificarResultado(10), 'flojo');
});
