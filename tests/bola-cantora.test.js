import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearPartida,
  empezar,
  fijarVoz,
  avanzar,
  alturaDeMidi,
  midiDeAltura,
  huecoDePuerta,
  xpDePartida,
  VIDAS_INICIALES,
  XP_MAXIMO_PARTIDA,
  SEPARACION_PUERTAS,
} from '../js/juegos/bola-cantora-logica.js';

const RANGO = { minimo: 48, maximo: 67 };
const aleatorioFijo = () => 0.5;

function simularHasta(partida, segundos, voz) {
  const eventos = [];
  const paso = 1 / 60;
  for (let t = 0; t < segundos; t += paso) {
    fijarVoz(partida, voz(partida));
    eventos.push(...avanzar(partida, paso));
  }
  return eventos;
}

test('la altura va de 0 (grave) a 1 (agudo) dentro del rango y es invertible', () => {
  assert.ok(alturaDeMidi(RANGO.minimo - 5, RANGO) === 0);
  assert.ok(alturaDeMidi(RANGO.maximo + 5, RANGO) === 1);
  const medio = alturaDeMidi(57.5, RANGO);
  assert.ok(Math.abs(midiDeAltura(medio, RANGO) - 57.5) < 1e-9);
});

test('cantando la nota de cada puerta se superan todas sin perder vidas', () => {
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  empezar(partida);
  const eventos = simularHasta(partida, 12, (p) => {
    const siguiente = p.puertas.find((puerta) => !puerta.superada && !puerta.chocada);
    return siguiente ? siguiente.nota : null;
  });
  const superadas = eventos.filter((evento) => evento.tipo === 'puerta').length;
  assert.ok(superadas >= 3, `solo ${superadas} puertas superadas`);
  assert.equal(eventos.filter((evento) => evento.tipo === 'choque').length, 0);
  assert.equal(partida.vidas, VIDAS_INICIALES);
  assert.equal(partida.estado, 'jugando');
});

test('en silencio la bola cae y acaba chocando hasta terminar la partida', () => {
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  empezar(partida);
  const eventos = simularHasta(partida, 20, () => null);
  assert.ok(eventos.some((evento) => evento.tipo === 'choque'));
  assert.equal(partida.estado, 'terminada');
  assert.equal(partida.vidas, 0);
});

test('las puertas se reciclan manteniendo la separación', () => {
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  empezar(partida);
  simularHasta(partida, 15, (p) => p.puertas[0]?.nota ?? null);
  for (let i = 1; i < partida.puertas.length; i++) {
    assert.equal(partida.puertas[i].x - partida.puertas[i - 1].x, SEPARACION_PUERTAS);
  }
  assert.ok(partida.puertas.every((puerta) => puerta.nota >= RANGO.minimo && puerta.nota <= RANGO.maximo));
});

test('en modo secuencia las puertas siguen las notas y la partida termina al acabarlas', () => {
  const secuencia = [55, 57, 59, 60, 59, 57, 55];
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo, secuencia });
  empezar(partida);
  assert.deepEqual(partida.puertas.map((puerta) => puerta.nota), secuencia.slice(0, 4));
  const eventos = simularHasta(partida, 40, (p) => {
    const siguiente = p.puertas.find((puerta) => !puerta.superada && !puerta.chocada);
    return siguiente ? siguiente.nota : null;
  });
  assert.equal(eventos.filter((evento) => evento.tipo === 'puerta').length, secuencia.length);
  assert.equal(partida.estado, 'terminada');
  assert.equal(partida.vidas, VIDAS_INICIALES);
});

test('el hueco de una puerta está centrado en la altura de su nota', () => {
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  const puerta = partida.puertas[0];
  const hueco = huecoDePuerta(partida, puerta);
  assert.ok(hueco.arriba < hueco.centro && hueco.centro < hueco.abajo);
});

test('el XP de la partida crece con las puertas y tiene tope', () => {
  assert.equal(xpDePartida(0), 0);
  assert.equal(xpDePartida(5), 10);
  assert.equal(xpDePartida(500), XP_MAXIMO_PARTIDA);
});
