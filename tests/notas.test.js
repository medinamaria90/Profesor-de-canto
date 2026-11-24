import { test } from 'node:test';
import assert from 'node:assert/strict';
import { midiAFrecuencia, frecuenciaAMidi, nombreNota, centsEntre, notaMasCercana } from '../js/musica/notas.js';

test('La4 es 440 Hz y el Do central es Do4', () => {
  assert.equal(midiAFrecuencia(69), 440);
  assert.equal(nombreNota(60), 'Do4');
  assert.equal(nombreNota(69), 'La4');
  assert.equal(nombreNota(61, false), 'Do#');
});

test('frecuencia y MIDI son inversas', () => {
  for (const midi of [40, 55, 60, 72]) {
    assert.ok(Math.abs(frecuenciaAMidi(midiAFrecuencia(midi)) - midi) < 1e-9);
  }
});

test('cents respecto a un objetivo', () => {
  assert.ok(Math.abs(centsEntre(440, 69)) < 1e-9);
  assert.ok(Math.abs(centsEntre(466.16, 69) - 100) < 0.1);
});

test('nota más cercana con desviación', () => {
  const { midi, cents } = notaMasCercana(445);
  assert.equal(midi, 69);
  assert.ok(cents > 15 && cents < 25);
});
