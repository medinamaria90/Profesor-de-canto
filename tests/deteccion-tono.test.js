import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectarTono, calcularRms } from '../js/audio/deteccion-tono.js';

const FRECUENCIA_MUESTREO = 48000;
const TAMANO_BLOQUE = 2048;

function generarSenal(frecuencia, { armonicos = [1, 0.5, 0.25], amplitud = 0.3 } = {}) {
  const buffer = new Float32Array(TAMANO_BLOQUE);
  for (let i = 0; i < TAMANO_BLOQUE; i++) {
    const t = i / FRECUENCIA_MUESTREO;
    let valor = 0;
    armonicos.forEach((peso, indice) => {
      valor += peso * Math.sin(2 * Math.PI * frecuencia * (indice + 1) * t);
    });
    buffer[i] = amplitud * valor;
  }
  return buffer;
}

test('detecta la fundamental de una señal con armónicos', () => {
  for (const frecuencia of [110, 196, 261.63, 440, 660]) {
    const resultado = detectarTono(generarSenal(frecuencia), FRECUENCIA_MUESTREO);
    assert.ok(resultado, `sin detección para ${frecuencia} Hz`);
    const errorRelativo = Math.abs(resultado.frecuencia - frecuencia) / frecuencia;
    assert.ok(errorRelativo < 0.01, `error ${errorRelativo} en ${frecuencia} Hz`);
    assert.ok(resultado.claridad > 0.9);
  }
});

test('no detecta tono en silencio ni en ruido', () => {
  assert.equal(detectarTono(new Float32Array(TAMANO_BLOQUE), FRECUENCIA_MUESTREO), null);
  const ruido = new Float32Array(TAMANO_BLOQUE);
  let semilla = 7;
  for (let i = 0; i < ruido.length; i++) {
    semilla = (semilla * 16807) % 2147483647;
    ruido[i] = (semilla / 2147483647 - 0.5) * 0.4;
  }
  assert.equal(detectarTono(ruido, FRECUENCIA_MUESTREO), null);
});

test('RMS de una senoidal de amplitud A es A/raíz(2)', () => {
  const rms = calcularRms(generarSenal(220, { armonicos: [1], amplitud: 0.5 }));
  assert.ok(Math.abs(rms - 0.5 / Math.SQRT2) < 0.01);
});
