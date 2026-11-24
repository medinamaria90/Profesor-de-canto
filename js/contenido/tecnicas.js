// Micro-lecciones de técnica vocal: tres o cuatro pasos claros y un gesto para probar en el momento.

export const TECNICAS = [
  {
    id: 'respiracion-diafragma',
    titulo: 'Respira con el diafragma',
    icono: '🫁',
    resumen: 'El aire sale de la tripa, no del pecho.',
    pasos: [
      'Pon una mano en la tripa y otra en el pecho.',
      'Inhala por la nariz: se mueve la tripa, no el pecho.',
      'Exhala con un «sss» largo y constante.',
      'Repite tres veces.',
    ],
    consejo: 'Si solo se mueve el pecho, prueba tumbada.',
  },
  {
    id: 'apoyo',
    titulo: 'El apoyo del aire',
    icono: '🎈',
    resumen: 'Suelta el aire con control.',
    pasos: [
      'Inhala como en la respiración diafragmática.',
      'Canta una «u» suave: la tripa baja despacio.',
      'Si la nota tiembla, frena el aire con la tripa, no con la garganta.',
    ],
    consejo: 'Aire hacia abajo, nota hacia delante.',
  },
  {
    id: 'resonancia',
    titulo: '¿De dónde sale la voz?',
    icono: '🗣️',
    resumen: 'La voz suena en la cara, no en la garganta.',
    pasos: [
      'Tararea «mmm» y nota el cosquilleo en labios y nariz.',
      'Abre la boca sin perder el cosquilleo: «mmm-aaa».',
      'Esa vibración es la resonancia.',
    ],
    consejo: 'Si duele la garganta, busca el cosquilleo en la cara.',
  },
  {
    id: 'vibrato',
    titulo: 'Qué es el vibrato',
    icono: '〰️',
    resumen: 'Una ondulación suave y regular de la nota.',
    pasos: [
      'Sostén una nota cómoda con buen apoyo.',
      'Deja que oscile un poco, unas 5 veces por segundo, sin forzar.',
      'Si no sale, llegará con el apoyo.',
    ],
    consejo: 'Forzado suena a cabra; natural, a cantante.',
  },
];

export function obtenerTecnica(id) {
  return TECNICAS.find((tecnica) => tecnica.id === id) ?? null;
}
