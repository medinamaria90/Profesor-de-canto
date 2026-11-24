import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instanciarEjercicios, calcularNotaBase } from '../js/contenido/ejercicios.js';
import { UNIDADES, RUTINA_DIARIA, leccionesOrdenadas, obtenerLeccion } from '../js/contenido/curriculum.js';

const RANGO = { minimo: 48, maximo: 67 };

function aleatorioFijo(valores) {
  let indice = 0;
  return () => valores[indice++ % valores.length];
}

test('la nota base centra los grados dentro del rango', () => {
  const plantillas = [{ tipo: 'melodia', melodia: { notas: [[0, 1], [12, 1]] } }];
  const base = calcularNotaBase(plantillas, RANGO);
  assert.ok(base >= RANGO.minimo && base + 12 <= RANGO.maximo);
});

test('todas las lecciones del camino caben en el rango estándar', () => {
  for (const leccion of [...leccionesOrdenadas(), RUTINA_DIARIA]) {
    const ejercicios = instanciarEjercicios(leccion.ejercicios, RANGO, aleatorioFijo([0.3, 0.7]));
    for (const ejercicio of ejercicios) {
      const notas = ejercicio.tipo === 'nota' ? [ejercicio.midi, ...ejercicio.escuchar]
        : ejercicio.tipo === 'melodia' ? ejercicio.notas.map((n) => n.midi).filter((n) => n !== null)
          : ejercicio.tipo === 'escucha' ? ejercicio.notas : [];
      for (const midi of notas) {
        assert.ok(midi >= RANGO.minimo && midi <= RANGO.maximo, `${leccion.id}: ${ejercicio.id} tiene ${midi} fuera de rango`);
      }
    }
  }
});

test('el nivel de oído estrecha el intervalo y, dominado, sustituye el oído por canto', () => {
  const [facil] = instanciarEjercicios([{ tipo: 'escucha', variante: 'agudo' }], RANGO, { aleatorio: aleatorioFijo([0.2, 0.9, 0.1]), nivelOido: 1 });
  assert.ok(Math.abs(facil.notas[0] - facil.notas[1]) >= 2);
  const [fino] = instanciarEjercicios([{ tipo: 'escucha', variante: 'agudo' }], RANGO, { aleatorio: aleatorioFijo([0.2, 0.9, 0.1]), nivelOido: 4 });
  assert.equal(Math.abs(fino.notas[0] - fino.notas[1]), 0.25);
  const [cantado] = instanciarEjercicios([{ tipo: 'escucha', variante: 'agudo' }], RANGO, { aleatorio: aleatorioFijo([0.2]), oidoDominado: true });
  assert.equal(cantado.tipo, 'nota');
});

test('los ejercicios de oído tienen respuesta coherente con las notas', () => {
  const [agudo] = instanciarEjercicios([{ tipo: 'escucha', variante: 'agudo' }], RANGO, aleatorioFijo([0.2, 0.9, 0.1]));
  const masAguda = agudo.notas[0] > agudo.notas[1] ? 'primera' : 'segunda';
  assert.equal(agudo.respuestaCorrecta, masAguda);

  const [igual] = instanciarEjercicios([{ tipo: 'escucha', variante: 'igual' }], RANGO, aleatorioFijo([0.1, 0.5]));
  assert.equal(igual.respuestaCorrecta, igual.notas[0] === igual.notas[1] ? 'iguales' : 'diferentes');
});

test('los identificadores de lección son únicos y se encuentran', () => {
  const ids = leccionesOrdenadas().map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(obtenerLeccion('u1-l1').titulo, UNIDADES[0].lecciones[0].titulo);
  assert.equal(obtenerLeccion(RUTINA_DIARIA.id), RUTINA_DIARIA);
  assert.equal(obtenerLeccion('no-existe'), null);
});

test('el reto convierte la canción en partitura: notas repetidas fundidas, inicios y duraciones en pulsos', async () => {
  const { partituraDeNotas } = await import('../js/contenido/ejercicios.js');
  const partitura = partituraDeNotas([{ midi: 60, pulsos: 0.5 }, { midi: 60, pulsos: 0.5 }, { midi: 62, pulsos: 1 }, { midi: 60, pulsos: 2 }]);
  assert.deepEqual(partitura, [
    { midi: 60, inicio: 0, duracion: 1 },
    { midi: 62, inicio: 1, duracion: 1 },
    { midi: 60, inicio: 2, duracion: 2 },
  ]);
});
