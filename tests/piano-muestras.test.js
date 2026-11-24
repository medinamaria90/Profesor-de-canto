import { test } from 'node:test';
import assert from 'node:assert/strict';
import { muestraMasCercana, nombreArchivoMuestra, midisMuestreados, MIDI_MINIMO_MUESTRA, MIDI_MAXIMO_MUESTRA } from '../js/audio/piano-muestras.js';

test('cada nota usa la muestra grabada más cercana, a un semitono como mucho', () => {
  assert.equal(muestraMasCercana(60), 60);
  assert.equal(muestraMasCercana(61), 62);
  assert.equal(muestraMasCercana(20), MIDI_MINIMO_MUESTRA);
  assert.equal(muestraMasCercana(100), MIDI_MAXIMO_MUESTRA);
  for (let midi = MIDI_MINIMO_MUESTRA; midi <= MIDI_MAXIMO_MUESTRA; midi++) assert.ok(Math.abs(muestraMasCercana(midi) - midi) <= 1);
});

test('los archivos se nombran con bemoles y octava científica', () => {
  assert.equal(nombreArchivoMuestra(60), 'C4.mp3');
  assert.equal(nombreArchivoMuestra(61), 'Db4.mp3');
  assert.equal(nombreArchivoMuestra(36), 'C2.mp3');
  assert.equal(midisMuestreados().length, 25);
});
