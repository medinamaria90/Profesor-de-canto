// Camino de aprendizaje: unidades, lecciones y plantillas de ejercicios (en grados relativos a la voz del usuario).
// Cada lección enseña algo (respiración, escala, intervalo, oído, técnica); las canciones se cantan enteras y una sola vez.

import * as M from '../musica/melodias.js';

const respiracion = (ciclos = 2) => ({ tipo: 'respiracion', ciclos });
const sirena = () => ({ tipo: 'sirena' });
const nota = (grado, escuchar = [grado], duracion = 2.5) => ({ tipo: 'nota', grado, escuchar, duracion });
const melodia = (definicion) => ({ tipo: 'melodia', melodia: definicion });
const escucha = (variante) => ({ tipo: 'escucha', variante });
const tecnica = (tecnicaId) => ({ tipo: 'tecnica', tecnicaId });
const cancion = (cancionId) => ({ tipo: 'cancion', cancionId });
const reto = (cancionId) => ({ tipo: 'reto', cancionId });

export const RUTINA_DIARIA = {
  id: 'rutina-diaria',
  titulo: 'Calentamiento diario',
  icono: '🌬️',
  descripcion: 'Respiración, sirena, escala y una nota larga.',
  minutos: 3,
  ejercicios: [respiracion(2), sirena(), melodia(M.ESCALA_CINCO_IDA_VUELTA), nota(4, [4], 3)],
};

export const UNIDADES = [
  {
    id: 'u1',
    numero: 1,
    titulo: 'Primer vuelo',
    descripcion: 'Respirar, afinar y tu primera canción.',
    lecciones: [
      { id: 'u1-l1', titulo: 'Respira', icono: '🫁', ejercicios: [tecnica('postura'), tecnica('respiracion-diafragma'), respiracion(2), sirena(), nota(0, [0], 3)] },
      { id: 'u1-l2', titulo: 'Tres notas', icono: '🎶', ejercicios: [tecnica('trino-labios'), melodia(M.ESCALA_TRES_NOTAS), nota(2, [0, 2]), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), nota(4, [0, 4])] },
      { id: 'u1-l3', titulo: 'Escala de cinco', icono: '🖐️', ejercicios: [tecnica('zumbido'), respiracion(1), melodia(M.ESCALA_CINCO_NOTAS), nota(7, [0, 7]), melodia(M.ESCALA_CINCO_IDA_VUELTA)] },
      { id: 'u1-l4', titulo: 'Primer vuelo', icono: '🎤', ejercicios: [tecnica('apoyo'), sirena(), cancion('primer-vuelo')] },
    ],
  },
  {
    id: 'u2',
    numero: 2,
    titulo: 'Afinar el oído',
    descripcion: 'Oído, terceras y dos canciones.',
    lecciones: [
      { id: 'u2-l1', titulo: '¿Más aguda?', icono: '👂', ejercicios: [tecnica('ataque'), escucha('agudo'), nota(4, [0, 4]), escucha('igual'), nota(2, [2], 3)] },
      { id: 'u2-l2', titulo: 'Terceras', icono: '🪜', ejercicios: [tecnica('resonancia'), nota(4, [0, 4]), melodia(M.ESCALA_TRES_NOTAS), escucha('agudo'), nota(0, [4, 0])] },
      { id: 'u2-l3', titulo: 'Fray Santiago', icono: '🔔', ejercicios: [tecnica('vocales'), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), cancion('fray-santiago')] },
      { id: 'u2-l4', titulo: 'Estrellita', icono: '⭐', ejercicios: [tecnica('mandibula-lengua'), nota(7, [0, 7]), melodia(M.SALTO_QUINTA), cancion('estrellita')] },
    ],
  },
  {
    id: 'u3',
    numero: 3,
    titulo: 'Saltos y armonía',
    descripcion: 'Cuartas, quintas, arpegios.',
    lecciones: [
      { id: 'u3-l1', titulo: 'Cuartas', icono: '🦘', ejercicios: [tecnica('proyeccion'), nota(5, [0, 5]), melodia(M.SALTO_CUARTA), escucha('agudo'), nota(0, [5, 0])] },
      { id: 'u3-l2', titulo: 'Quintas y arpegios', icono: '🎼', ejercicios: [tecnica('pajita'), nota(7, [0, 7]), melodia(M.SALTO_QUINTA), melodia(M.ARPEGIO_MAYOR), escucha('igual')] },
      { id: 'u3-l3', titulo: 'Cumpleaños feliz', icono: '🎂', ejercicios: [respiracion(1), melodia(M.ARPEGIO_MAYOR), cancion('cumpleanos-feliz')] },
      { id: 'u3-l4', titulo: 'Vuela con la alondra', icono: '🐦', ejercicios: [sirena(), reto('cumpleanos-feliz')] },
    ],
  },
  {
    id: 'u4',
    numero: 4,
    titulo: 'La octava',
    descripcion: 'Saltos grandes y vibrato.',
    lecciones: [
      { id: 'u4-l1', titulo: 'Octava', icono: '🚀', ejercicios: [tecnica('registros'), sirena(), nota(12, [0, 12]), melodia(M.SALTO_OCTAVA), melodia(M.ARPEGIO_OCTAVA)] },
      { id: 'u4-l2', titulo: 'Vibrato', icono: '〰️', ejercicios: [tecnica('vibrato'), nota(7, [7], 4), melodia(M.ESCALA_CINCO_IDA_VUELTA)] },
      { id: 'u4-l3', titulo: 'Cucú, cantaba la rana', icono: '🐸', ejercicios: [tecnica('messa-di-voce'), nota(7, [4, 7]), melodia(M.CUCU_CANTABA_LA_RANA)] },
      { id: 'u4-l4', titulo: 'Himno de la alegría', icono: '🎻', ejercicios: [melodia(M.ESCALA_CINCO_IDA_VUELTA), cancion('himno-alegria')] },
    ],
  },
  {
    id: 'u5',
    numero: 5,
    titulo: 'Canciones',
    descripcion: 'Tango, jazz y un vuelo final.',
    lecciones: [
      { id: 'u5-l1', titulo: 'Debajo un botón', icono: '🔘', ejercicios: [tecnica('cuidar-la-voz'), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), melodia(M.DEBAJO_UN_BOTON)] },
      { id: 'u5-l2', titulo: 'Repaso', icono: '🏅', ejercicios: [sirena(), melodia(M.ARPEGIO_OCTAVA), nota(12, [0, 12], 3), escucha('igual')] },
      { id: 'u5-l3', titulo: 'Por una cabeza', icono: '💃', ejercicios: [respiracion(1), sirena(), cancion('por-una-cabeza')] },
      { id: 'u5-l4', titulo: 'Summertime', icono: '🎷', ejercicios: [tecnica('apoyo'), nota(7, [0, 7], 4), cancion('summertime')] },
      { id: 'u5-l5', titulo: 'Vuelo final', icono: '🌅', ejercicios: [sirena(), reto('por-una-cabeza')] },
    ],
  },
];

export function leccionesOrdenadas() {
  return UNIDADES.flatMap((unidad) => unidad.lecciones.map((leccion) => ({ ...leccion, unidadId: unidad.id })));
}

export function obtenerLeccion(leccionId) {
  if (leccionId === RUTINA_DIARIA.id) return RUTINA_DIARIA;
  return leccionesOrdenadas().find((leccion) => leccion.id === leccionId) ?? null;
}

// Una lección se desbloquea cuando la anterior tiene al menos una estrella. La primera siempre está abierta.
export function leccionDesbloqueada(estado, leccionId) {
  const lista = leccionesOrdenadas();
  const indice = lista.findIndex((leccion) => leccion.id === leccionId);
  if (indice <= 0) return indice === 0;
  const anterior = lista[indice - 1];
  return (estado.lecciones[anterior.id]?.estrellas ?? 0) >= 1;
}

export function siguienteLeccionPendiente(estado) {
  return leccionesOrdenadas().find((leccion) => (estado.lecciones[leccion.id]?.estrellas ?? 0) === 0) ?? null;
}

export function unidadCompletada(estado, unidadId) {
  const unidad = UNIDADES.find((u) => u.id === unidadId);
  return unidad ? unidad.lecciones.every((leccion) => (estado.lecciones[leccion.id]?.estrellas ?? 0) >= 1) : false;
}
