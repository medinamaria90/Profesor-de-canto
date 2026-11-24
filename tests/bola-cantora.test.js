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
  dificultad,
  VELOCIDAD_INICIAL,
  VELOCIDAD_MAXIMA,
  ANCHO_PUERTA,
  ANCHO_PUERTA_MAXIMO,
  ALTO_HUECO_RELATIVO,
  ALTO_HUECO_MINIMO_RELATIVO,
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

test('con partitura cada nota es una puerta tan ancha como dura, en su momento, y la partida termina al acabarla', () => {
  const partitura = [
    { midi: 55, inicio: 1, duracion: 0.5 },
    { midi: 57, inicio: 1.5, duracion: 0.5 },
    { midi: 60, inicio: 2, duracion: 2 },
  ];
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo, partitura, velocidad: 200 });
  empezar(partida);
  assert.equal(partida.puertas.length, 3);
  assert.equal(partida.puertas[2].ancho, ANCHO_PUERTA);
  assert.equal(partida.puertas[2].largo, 400);
  assert.equal(partida.puertas[1].x - partida.puertas[0].x, 100);
  // Quien canta se adelanta un poco al cambio de nota: la voz sigue a la puerta que está a punto de llegar.
  const ANTICIPACION_PIXELES = 40;
  const eventos = simularHasta(partida, 6, (p) => {
    const siguiente = p.puertas.find((puerta) => puerta.x - p.desplazamiento + puerta.ancho > p.bola.x + ANTICIPACION_PIXELES);
    return siguiente ? siguiente.nota : null;
  });
  assert.equal(eventos.filter((evento) => evento.tipo === 'puerta').length, 3);
  assert.equal(partida.estado, 'terminada');
  assert.equal(partida.vidas, VIDAS_INICIALES);
  assert.equal(partida.velocidad, 200);
});

test('salir del hueco un instante no cuesta vida; salir más tiempo, sí', () => {
  const partitura = [{ midi: 60, inicio: 0.5, duracion: 3 }];
  const breve = crearPartida(RANGO, { aleatorio: aleatorioFijo, partitura, velocidad: 200 });
  const larga = crearPartida(RANGO, { aleatorio: aleatorioFijo, partitura, velocidad: 200 });
  empezar(breve);
  empezar(larga);
  // La puerta pasa por la bola en el segundo 0,5: desafinar un instante justo ahí se perdona; desafinar antes y durante, no.
  simularHasta(breve, 3, (p) => (p.tiempo > 0.46 && p.tiempo < 0.5 ? 48 : 60));
  simularHasta(larga, 3, (p) => (p.tiempo > 0.2 && p.tiempo < 0.9 ? 48 : 60));
  assert.equal(breve.vidas, VIDAS_INICIALES);
  assert.equal(larga.vidas, VIDAS_INICIALES - 1);
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

test('la dificultad sube con las puertas y tiene topes', () => {
  const inicio = dificultad(0);
  assert.equal(inicio.velocidad, VELOCIDAD_INICIAL);
  assert.equal(inicio.anchoPuerta, ANCHO_PUERTA);
  assert.equal(inicio.huecoRelativo, ALTO_HUECO_RELATIVO);
  const media = dificultad(12);
  assert.ok(media.velocidad > inicio.velocidad);
  assert.ok(media.anchoPuerta > inicio.anchoPuerta);
  assert.ok(media.huecoRelativo < inicio.huecoRelativo);
  assert.ok(media.saltoMaximo > inicio.saltoMaximo);
  const tope = dificultad(200);
  assert.equal(tope.velocidad, VELOCIDAD_MAXIMA);
  assert.equal(tope.anchoPuerta, ANCHO_PUERTA_MAXIMO);
  assert.equal(tope.huecoRelativo, ALTO_HUECO_MINIMO_RELATIVO);
  assert.equal(tope.saltoMaximo, 12);
});

test('desafinar un semitono y medio pasa al principio pero no con el hueco estrecho', () => {
  const abierta = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  const estrecha = crearPartida(RANGO, { aleatorio: aleatorioFijo });
  estrecha.puertasSuperadas = 40;
  estrecha.puertas = [];
  estrecha.puertas.push({ x: 300, nota: 58, ancho: ANCHO_PUERTA_MAXIMO, huecoRelativo: ALTO_HUECO_MINIMO_RELATIVO, superada: false, chocada: false });
  abierta.puertas = [{ x: 300, nota: 58, ancho: ANCHO_PUERTA, huecoRelativo: ALTO_HUECO_RELATIVO, superada: false, chocada: false }];
  for (const partida of [abierta, estrecha]) {
    partida.partitura = [];
    empezar(partida);
    simularHasta(partida, 6, () => 58 + 1.5);
  }
  assert.equal(abierta.vidas, VIDAS_INICIALES);
  assert.equal(estrecha.vidas, VIDAS_INICIALES - 1);
});

test('con partitura la dificultad no sube', () => {
  const partitura = Array.from({ length: 20 }, (_, i) => ({ midi: 58, inicio: 0.5 + i, duracion: 0.5 }));
  const partida = crearPartida(RANGO, { aleatorio: aleatorioFijo, partitura, velocidad: VELOCIDAD_INICIAL });
  empezar(partida);
  simularHasta(partida, 25, () => 58);
  assert.ok(partida.puertasSuperadas >= 10);
  assert.equal(partida.velocidad, VELOCIDAD_INICIAL);
  assert.ok(partida.puertas.every((puerta) => puerta.huecoRelativo === ALTO_HUECO_RELATIVO));
});
