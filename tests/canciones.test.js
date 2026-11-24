import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANCIONES, obtenerCancion, notasDeFrase, pulsoInicioFrase } from '../js/contenido/canciones.js';
import { compasesDeMelodia, PULSOS_POR_COMPAS } from '../js/musica/arreglos.js';

test('todas las canciones son coherentes: frases ordenadas, acordes dentro de los compases, ámbito cantable', () => {
  for (const cancion of CANCIONES) {
    assert.ok(cancion.notas.length >= 8, `${cancion.id}: muy corta`);
    assert.equal(cancion.frases[0], 0, `${cancion.id}: la primera frase debe empezar en 0`);
    for (let i = 1; i < cancion.frases.length; i++) assert.ok(cancion.frases[i] > cancion.frases[i - 1], `${cancion.id}: frases desordenadas`);
    assert.ok(cancion.frases.at(-1) < cancion.notas.length);
    const compases = compasesDeMelodia(cancion.notas);
    for (const acorde of cancion.acordes) assert.ok(acorde.compas < compases, `${cancion.id}: acorde fuera de la canción`);
    const grados = cancion.notas.map(([grado]) => grado);
    assert.ok(Math.max(...grados) - Math.min(...grados) <= 17, `${cancion.id}: ámbito demasiado amplio`);
    assert.ok(cancion.notas.every(([, pulsos]) => pulsos > 0));
  }
});

test('las frases se cortan por sus índices y empiezan en el pulso correcto', () => {
  const cancion = obtenerCancion('primer-vuelo');
  assert.equal(notasDeFrase(cancion, 0).length, 6);
  assert.equal(pulsoInicioFrase(cancion, 1), 2 * PULSOS_POR_COMPAS);
  assert.equal(notasDeFrase(cancion, 3).at(-1)[1], 4);
  assert.equal(obtenerCancion('no-existe'), null);
});

test('la canción del nivel 1 solo usa cinco grados y empieza en la tónica', () => {
  const cancion = obtenerCancion('primer-vuelo');
  const grados = new Set(cancion.notas.map(([grado]) => grado));
  assert.deepEqual([...grados].sort((a, b) => a - b), [0, 2, 4, 5, 7]);
  assert.equal(cancion.notas[0][0], 0);
});
