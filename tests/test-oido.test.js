import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearEscalera,
  responderRelativo,
  intervaloActual,
  umbralRelativo,
  valorarRelativo,
  evaluarAbsoluto,
  valorarAbsoluto,
  notaAbsolutaAleatoria,
  parRelativo,
  NIVELES_RELATIVO_CENTS,
} from '../js/ejercicios/test-oido-logica.js';

test('la escalera sube con dos aciertos, baja con un fallo y no se sale de los niveles', () => {
  let escalera = crearEscalera();
  assert.equal(intervaloActual(escalera), 700);
  escalera = responderRelativo(escalera, true);
  escalera = responderRelativo(escalera, true);
  assert.equal(intervaloActual(escalera), 500);
  escalera = responderRelativo(escalera, false);
  assert.equal(intervaloActual(escalera), 700);
  escalera = responderRelativo(escalera, false);
  assert.equal(intervaloActual(escalera), 700);
  for (let i = 0; i < 40; i++) escalera = responderRelativo(escalera, true);
  assert.equal(intervaloActual(escalera), NIVELES_RELATIVO_CENTS.at(-1));
});

test('el umbral se estima con los cambios de sentido y se valora', () => {
  let escalera = crearEscalera();
  // Acierta hasta 50 cents, falla en 25, vuelve a acertar en 50, falla en 25...
  const patron = [true, true, true, true, true, true, true, true, true, true, false, true, true, false, true, true, false];
  for (const acierto of patron) escalera = responderRelativo(escalera, acierto);
  const umbral = umbralRelativo(escalera);
  // La escalera oscila entre 50 y 100 cents, así que el umbral queda entre ambos.
  assert.ok(umbral >= 50 && umbral <= 100, `umbral ${umbral}`);
  assert.equal(valorarRelativo(umbral), umbral <= 60 ? 'bueno' : 'normal');
  assert.equal(valorarRelativo(400), 'a-entrenar');
  assert.equal(umbralRelativo(crearEscalera()), 700);
});

test('el oído absoluto se evalúa contra el azar', () => {
  const respuestas = [
    { correcta: 0, elegida: 0 }, { correcta: 4, elegida: 4 }, { correcta: 7, elegida: 8 }, { correcta: 11, elegida: 0 }, { correcta: 2, elegida: 9 },
  ];
  const resultado = evaluarAbsoluto(respuestas);
  assert.equal(resultado.exactas, 2);
  assert.equal(resultado.cercanas, 2);
  assert.equal(resultado.porcentajeExacto, 40);
  assert.equal(resultado.azar, 8);
  assert.equal(valorarAbsoluto(resultado), 'indicios');
  assert.equal(valorarAbsoluto({ porcentajeExacto: 90 }), 'probable');
  assert.equal(valorarAbsoluto(evaluarAbsoluto([])), 'no');
});

test('las notas del test no repiten la anterior y los pares respetan la distancia', () => {
  let semilla = 0.1;
  const aleatorio = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
  const nota = notaAbsolutaAleatoria(60, aleatorio);
  assert.notEqual(nota % 12, 0);
  const par = parRelativo(50, aleatorio);
  assert.ok(Math.abs((par.notas[0] - par.notas[1]) * 100 - 50) < 1e-9);
  assert.equal(par.respuestaCorrecta, par.notas[0] > par.notas[1] ? 'primera' : 'segunda');
});
