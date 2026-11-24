import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANCIONES, obtenerCancion } from '../js/contenido/canciones.js';
import { compasesDeMelodia } from '../js/musica/arreglos.js';

test('todas las canciones son coherentes: frases ordenadas, acordes dentro de los compases, ámbito cantable', () => {
  for (const cancion of CANCIONES) {
    assert.ok(cancion.notas.length >= 8, `${cancion.id}: muy corta`);
    assert.equal(cancion.frases[0], 0, `${cancion.id}: la primera frase debe empezar en 0`);
    for (let i = 1; i < cancion.frases.length; i++) assert.ok(cancion.frases[i] > cancion.frases[i - 1], `${cancion.id}: frases desordenadas`);
    assert.ok(cancion.frases.at(-1) < cancion.notas.length);
    const compases = compasesDeMelodia(cancion.notas, cancion.pulsosPorCompas, cancion.anacrusa);
    for (const acorde of cancion.acordes) {
      assert.ok(acorde.compas >= 0 && acorde.compas < compases, `${cancion.id}: acorde fuera de la canción`);
      assert.ok(acorde.pulso >= 0 && acorde.pulso < cancion.pulsosPorCompas, `${cancion.id}: acorde fuera del compás`);
    }
    // Los compases enteros deben cuadrar: tras la anacrusa, las notas se agrupan en compases exactos (el último puede quedar corto).
    const pulsos = cancion.notas.reduce((suma, [, duracion]) => suma + duracion, 0);
    assert.ok(pulsos - cancion.anacrusa > (compases - 1) * cancion.pulsosPorCompas, `${cancion.id}: sobran compases`);
    assert.ok([3, 4].includes(cancion.pulsosPorCompas) && cancion.anacrusa < cancion.pulsosPorCompas, `${cancion.id}: compás raro`);
    const grados = cancion.notas.map(([grado]) => grado);
    assert.ok(Math.max(...grados) - Math.min(...grados) <= 17, `${cancion.id}: ámbito demasiado amplio`);
    assert.ok(cancion.notas.every(([, pulsos]) => pulsos > 0));
  }
});

test('una canción desconocida devuelve null', () => {
  assert.equal(obtenerCancion('no-existe'), null);
});

test('la canción del nivel 1 solo usa cinco grados y empieza en la tónica', () => {
  const cancion = obtenerCancion('primer-vuelo');
  const grados = new Set(cancion.notas.map(([grado]) => grado));
  assert.deepEqual([...grados].sort((a, b) => a - b), [0, 2, 4, 5, 7]);
  assert.equal(cancion.notas[0][0], 0);
});

test('Cumpleaños feliz es un vals con anacrusa, empieza en la dominante y cambia de acorde donde se espera', () => {
  const cancion = obtenerCancion('cumpleanos-feliz');
  assert.equal(cancion.pulsosPorCompas, 3);
  assert.equal(cancion.anacrusa, 1);
  assert.equal(cancion.tonica, 5);
  // Sin la anacrusa, cada frase ocupa compases enteros: 1 + 8 compases de 3 menos el último, corto.
  assert.equal(compasesDeMelodia(cancion.notas, 3, 1), 8);
  const enCompas = (compas) => cancion.acordes.filter((acorde) => acorde.compas === compas).map((acorde) => acorde.grados[0]);
  assert.deepEqual(enCompas(0), [0]); // «birth-day to» → tónica
  assert.deepEqual(enCompas(1), [7]); // «you» → dominante
  assert.deepEqual(enCompas(5), [5]); // «dear …» → subdominante
  assert.deepEqual(enCompas(6), [0, 7]); // «birth-day to» → tónica y dominante a mitad de compás
});
