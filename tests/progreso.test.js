import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADO_INICIAL,
  registrarActividad,
  registrarLeccion,
  registrarRutina,
  rachaVigente,
  calcularXpLeccion,
  diasEntre,
  rangoVocalEfectivo,
  RANGO_VOCAL_POR_DEFECTO,
  migrarEstado,
  XP_RUTINA_DIARIA,
  guardarRangoVocal,
  mejoraDelRango,
  registrarRespuestaOido,
  habilidadOido,
  oidoDominado,
  NIVEL_OIDO_MAXIMO,
} from '../js/estado/progreso.js';
import { evaluarLogros } from '../js/contenido/logros.js';
import { leccionDesbloqueada } from '../js/contenido/curriculum.js';

test('la racha crece en días consecutivos y se reinicia tras un hueco', () => {
  let estado = registrarActividad(ESTADO_INICIAL, 10, '2026-01-01');
  assert.equal(estado.racha, 1);
  estado = registrarActividad(estado, 10, '2026-01-01');
  assert.equal(estado.racha, 1);
  estado = registrarActividad(estado, 10, '2026-01-02');
  assert.equal(estado.racha, 2);
  estado = registrarActividad(estado, 10, '2026-01-05');
  assert.equal(estado.racha, 1);
  assert.equal(estado.mejorRacha, 2);
  assert.equal(estado.xpTotal, 40);
});

test('la racha vigente cae a cero si ayer no hubo actividad', () => {
  const estado = registrarActividad(ESTADO_INICIAL, 10, '2026-03-01');
  assert.equal(rachaVigente(estado, '2026-03-02'), 1);
  assert.equal(rachaVigente(estado, '2026-03-03'), 0);
  assert.equal(diasEntre('2026-02-28', '2026-03-01'), 1);
});

test('XP de lección: un décimo de los puntos más bonus si es redonda', () => {
  assert.equal(calcularXpLeccion([100, 100, 100]), 45);
  assert.equal(calcularXpLeccion([60, 70, 80]), 21);
  assert.equal(calcularXpLeccion([100, 100, 100], { conBonus: false }), 30);
  assert.equal(calcularXpLeccion([]), 0);
});

test('registrar lección guarda el mejor resultado y desbloquea la siguiente', () => {
  let estado = registrarLeccion(ESTADO_INICIAL, { leccionId: 'u1-l1', puntuacion: 60, estrellas: 1, xp: 30, hoy: '2026-01-01' });
  estado = registrarLeccion(estado, { leccionId: 'u1-l1', puntuacion: 40, estrellas: 0, xp: 20, hoy: '2026-01-01' });
  assert.equal(estado.lecciones['u1-l1'].mejorPuntuacion, 60);
  assert.equal(estado.lecciones['u1-l1'].estrellas, 1);
  assert.equal(estado.lecciones['u1-l1'].intentos, 2);
  assert.equal(leccionDesbloqueada(estado, 'u1-l2'), true);
  assert.equal(leccionDesbloqueada(estado, 'u1-l3'), false);
  assert.equal(leccionDesbloqueada(ESTADO_INICIAL, 'u1-l1'), true);
});

test('la rutina diaria suma XP fijo y queda marcada para el día', () => {
  const estado = registrarRutina(ESTADO_INICIAL, 80, '2026-01-01');
  assert.equal(estado.xpTotal, XP_RUTINA_DIARIA);
  assert.equal(estado.rutinasDiarias['2026-01-01'], 80);
});

test('logros se desbloquean una sola vez', () => {
  const conLeccion = registrarLeccion(ESTADO_INICIAL, { leccionId: 'u1-l1', puntuacion: 96, estrellas: 3, xp: 45, hoy: '2026-01-01' });
  const primera = evaluarLogros(conLeccion, '2026-01-01');
  const ids = primera.nuevos.map((l) => l.id);
  assert.ok(ids.includes('primera-voz'));
  assert.ok(ids.includes('ruisenor'));
  const segunda = evaluarLogros(primera.estado, '2026-01-02');
  assert.equal(segunda.nuevos.length, 0);
});

test('rango vocal: usa el estándar si no hay medida o es demasiado estrecho', () => {
  assert.deepEqual(rangoVocalEfectivo(ESTADO_INICIAL), RANGO_VOCAL_POR_DEFECTO);
  assert.deepEqual(rangoVocalEfectivo({ rangoVocal: { minimo: 60, maximo: 63 } }), RANGO_VOCAL_POR_DEFECTO);
  assert.deepEqual(rangoVocalEfectivo({ rangoVocal: { minimo: 50, maximo: 70 } }), { minimo: 50, maximo: 70 });
});

test('el rango medido se apunta en el historial, una entrada por día', () => {
  let estado = guardarRangoVocal(ESTADO_INICIAL, 50, 60, '2026-01-01');
  estado = guardarRangoVocal(estado, 50, 62, '2026-01-01');
  estado = guardarRangoVocal(estado, 48, 64, '2026-01-10');
  assert.equal(estado.historialRango.length, 2);
  assert.deepEqual(estado.rangoVocal, { minimo: 48, maximo: 64 });
  assert.equal(mejoraDelRango(estado), 4);
  assert.equal(mejoraDelRango(ESTADO_INICIAL), 0);
});

test('el oído sube de nivel con tres aciertos seguidos y baja con un fallo', () => {
  let estado = ESTADO_INICIAL;
  for (let i = 0; i < 3; i++) estado = registrarRespuestaOido(estado, true);
  assert.equal(habilidadOido(estado).nivel, 2);
  assert.equal(habilidadOido(estado).racha, 0);
  estado = registrarRespuestaOido(estado, false);
  assert.equal(habilidadOido(estado).nivel, 1);
  for (let i = 0; i < 12; i++) estado = registrarRespuestaOido(estado, true);
  assert.equal(habilidadOido(estado).nivel, NIVEL_OIDO_MAXIMO);
  assert.equal(oidoDominado(estado), true);
  assert.equal(habilidadOido(estado).intentos, 16);
});

test('migrar completa estados antiguos o corruptos', () => {
  assert.equal(migrarEstado(null).xpTotal, 0);
  assert.equal(migrarEstado({ xpTotal: 12 }).xpTotal, 12);
  assert.deepEqual(migrarEstado({ xpTotal: 12 }).lecciones, {});
});
