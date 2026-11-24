import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TECNICAS, obtenerTecnica } from '../js/contenido/tecnicas.js';
import { EJEMPLOS } from '../js/audio/ejemplos-voz.js';
import { leccionesOrdenadas } from '../js/contenido/curriculum.js';

test('cada técnica explica qué es, cómo se hace y en qué se falla, y su ejemplo sonoro existe', () => {
  const ids = new Set();
  for (const tecnica of TECNICAS) {
    assert.ok(!ids.has(tecnica.id), `${tecnica.id} repetida`);
    ids.add(tecnica.id);
    assert.ok(tecnica.queEs.length > 40, `${tecnica.id}: falta la explicación`);
    assert.ok(tecnica.pasos.length >= 3 && tecnica.pasos.length <= 5, `${tecnica.id}: pasos`);
    assert.ok(tecnica.errores.length >= 1, `${tecnica.id}: errores`);
    assert.ok(tecnica.consejo, `${tecnica.id}: consejo`);
    if (tecnica.ejemplo) assert.ok(typeof EJEMPLOS[tecnica.ejemplo] === 'function', `${tecnica.id}: ejemplo ${tecnica.ejemplo} no existe`);
  }
  assert.equal(obtenerTecnica('no-existe'), null);
});

test('todas las técnicas se enseñan en alguna lección y cada lección las usa como mucho dos veces', () => {
  const usadas = new Map();
  for (const leccion of leccionesOrdenadas()) {
    const enLeccion = leccion.ejercicios.filter((ejercicio) => ejercicio.tipo === 'tecnica');
    assert.ok(enLeccion.length <= 2, `${leccion.id}: demasiadas técnicas`);
    for (const ejercicio of enLeccion) usadas.set(ejercicio.tecnicaId, (usadas.get(ejercicio.tecnicaId) ?? 0) + 1);
  }
  for (const tecnica of TECNICAS) assert.ok(usadas.has(tecnica.id), `${tecnica.id} no se enseña`);
});
