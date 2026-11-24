// Camino de aprendizaje: unidades, lecciones y plantillas de ejercicios (en grados relativos a la voz del usuario).

import * as M from '../musica/melodias.js';

const respiracion = (ciclos = 2) => ({ tipo: 'respiracion', ciclos });
const sirena = () => ({ tipo: 'sirena' });
const nota = (grado, escuchar = [grado], duracion = 2.5) => ({ tipo: 'nota', grado, escuchar, duracion });
const melodia = (definicion) => ({ tipo: 'melodia', melodia: definicion });
const escucha = (variante) => ({ tipo: 'escucha', variante });

export const RUTINA_DIARIA = {
  id: 'rutina-diaria',
  titulo: 'Calentamiento diario',
  descripcion: 'Respiración, sirena, escala y una nota larga.',
  minutos: 3,
  ejercicios: [respiracion(2), sirena(), melodia(M.ESCALA_CINCO_IDA_VUELTA), nota(4, [4], 3)],
};

export const UNIDADES = [
  {
    id: 'u1',
    numero: 1,
    titulo: 'Despertar la voz',
    descripcion: 'Respira, suena y encuentra tu primera nota.',
    lecciones: [
      { id: 'u1-l1', titulo: 'Respira y suena', icono: '🌬️', ejercicios: [respiracion(2), sirena(), nota(0), escucha('agudo'), nota(0)] },
      { id: 'u1-l2', titulo: 'Tu primera nota', icono: '🎯', ejercicios: [nota(0), nota(2), escucha('agudo'), nota(4), nota(2, [0, 2])] },
      { id: 'u1-l3', titulo: 'Dos notas', icono: '🎵', ejercicios: [melodia(M.DOS_NOTAS), nota(2, [0, 2]), escucha('igual'), melodia(M.DOS_NOTAS_VUELTA), nota(0)] },
      { id: 'u1-l4', titulo: 'Repaso', icono: '⭐', ejercicios: [sirena(), nota(4), melodia(M.DOS_NOTAS_VUELTA), escucha('agudo'), nota(2, [0, 2]), escucha('igual')] },
    ],
  },
  {
    id: 'u2',
    numero: 2,
    titulo: 'Afinar el oído',
    descripcion: 'Terceras, escalas cortas y notas que se sostienen.',
    lecciones: [
      { id: 'u2-l1', titulo: 'Tres notas', icono: '🎶', ejercicios: [melodia(M.ESCALA_TRES_NOTAS), nota(4, [0, 4]), escucha('igual'), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), nota(2, [2], 3)] },
      { id: 'u2-l2', titulo: 'Terceras', icono: '🪜', ejercicios: [nota(4, [0, 4]), melodia(M.ESCALA_TRES_NOTAS), escucha('agudo'), nota(0, [4, 0]), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA)] },
      { id: 'u2-l3', titulo: 'Escala de cinco', icono: '🖐️', ejercicios: [respiracion(1), melodia(M.ESCALA_CINCO_NOTAS), nota(7, [0, 7]), escucha('igual'), melodia(M.ESCALA_CINCO_IDA_VUELTA)] },
      { id: 'u2-l4', titulo: 'Repaso', icono: '⭐', ejercicios: [sirena(), melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), nota(5, [0, 5]), escucha('agudo'), melodia(M.ESCALA_CINCO_NOTAS), nota(7, [7], 3)] },
    ],
  },
  {
    id: 'u3',
    numero: 3,
    titulo: 'Primeras melodías',
    descripcion: 'Canciones que ya conoces, nota a nota.',
    lecciones: [
      { id: 'u3-l1', titulo: 'Fray Santiago', icono: '🔔', ejercicios: [melodia(M.ESCALA_TRES_NOTAS), nota(4, [0, 4]), melodia(M.FRAY_SANTIAGO), escucha('igual'), melodia(M.FRAY_SANTIAGO)] },
      { id: 'u3-l2', titulo: 'Cumpleaños feliz', icono: '🎂', ejercicios: [nota(5, [0, 5]), melodia(M.ESCALA_CINCO_NOTAS), melodia(M.CUMPLEANOS_FELIZ), escucha('agudo'), melodia(M.CUMPLEANOS_FELIZ)] },
      { id: 'u3-l3', titulo: 'Estrellita', icono: '⭐', ejercicios: [nota(7, [0, 7]), melodia(M.SALTO_QUINTA), melodia(M.ESTRELLITA_PRIMERA_PARTE), escucha('igual'), melodia(M.ESTRELLITA_PRIMERA_PARTE)] },
      { id: 'u3-l4', titulo: 'Repaso', icono: '🏅', ejercicios: [respiracion(1), melodia(M.FRAY_SANTIAGO), nota(9, [7, 9]), melodia(M.CUMPLEANOS_FELIZ), melodia(M.ESTRELLITA_PRIMERA_PARTE)] },
    ],
  },
  {
    id: 'u4',
    numero: 4,
    titulo: 'Saltos e intervalos',
    descripcion: 'Cuartas, quintas, arpegios y la octava.',
    lecciones: [
      { id: 'u4-l1', titulo: 'Cuartas', icono: '🦘', ejercicios: [nota(5, [0, 5]), melodia(M.SALTO_CUARTA), escucha('agudo'), nota(0, [5, 0]), melodia(M.SALTO_CUARTA)] },
      { id: 'u4-l2', titulo: 'Quintas y arpegios', icono: '🎼', ejercicios: [nota(7, [0, 7]), melodia(M.SALTO_QUINTA), melodia(M.ARPEGIO_MAYOR), escucha('igual'), melodia(M.ARPEGIO_MAYOR)] },
      { id: 'u4-l3', titulo: 'La octava', icono: '🚀', ejercicios: [sirena(), nota(12, [0, 12]), melodia(M.SALTO_OCTAVA), escucha('agudo'), melodia(M.ARPEGIO_OCTAVA)] },
      { id: 'u4-l4', titulo: 'Repaso', icono: '🏅', ejercicios: [melodia(M.SALTO_CUARTA), melodia(M.SALTO_QUINTA), nota(12, [0, 12], 3), melodia(M.ARPEGIO_OCTAVA), escucha('igual')] },
    ],
  },
  {
    id: 'u5',
    numero: 5,
    titulo: 'Canciones',
    descripcion: 'Melodías completas para lucirte.',
    lecciones: [
      { id: 'u5-l1', titulo: 'Himno de la alegría', icono: '🎻', ejercicios: [melodia(M.ESCALA_CINCO_IDA_VUELTA), nota(4, [0, 4]), melodia(M.HIMNO_ALEGRIA), escucha('igual'), melodia(M.HIMNO_ALEGRIA)] },
      { id: 'u5-l2', titulo: 'Estrellita completa', icono: '🌟', ejercicios: [melodia(M.ESTRELLITA_PRIMERA_PARTE), melodia(M.ESTRELLITA_SEGUNDA_PARTE), nota(9, [7, 9]), melodia(M.ESTRELLITA_SEGUNDA_PARTE)] },
      { id: 'u5-l3', titulo: 'Cucú, cantaba la rana', icono: '🐸', ejercicios: [nota(7, [4, 7]), melodia(M.ARPEGIO_MAYOR), melodia(M.CUCU_CANTABA_LA_RANA), escucha('agudo'), melodia(M.CUCU_CANTABA_LA_RANA)] },
      { id: 'u5-l4', titulo: 'Debajo un botón', icono: '🔘', ejercicios: [melodia(M.ESCALA_TRES_NOTAS_IDA_VUELTA), melodia(M.DEBAJO_UN_BOTON), escucha('igual'), melodia(M.DEBAJO_UN_BOTON)] },
      { id: 'u5-l5', titulo: 'Gran repaso', icono: '👑', ejercicios: [respiracion(1), sirena(), melodia(M.HIMNO_ALEGRIA), melodia(M.CUCU_CANTABA_LA_RANA), nota(12, [0, 12], 3), melodia(M.ESTRELLITA_PRIMERA_PARTE)] },
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
