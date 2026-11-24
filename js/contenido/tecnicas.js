// Micro-lecciones de técnica vocal: tres o cuatro pasos claros y un gesto para probar en el momento.

export const TECNICAS = [
  {
    id: 'respiracion-diafragma',
    titulo: 'Respira con el diafragma',
    icono: '🫁',
    resumen: 'La voz se apoya en el aire, y el aire bueno sale de la tripa, no del pecho.',
    pasos: [
      'Pon una mano en la tripa y otra en el pecho.',
      'Inhala por la nariz despacio: la mano de la tripa se mueve hacia fuera y la del pecho casi no se mueve.',
      'Exhala con un «sss» largo y constante, como si desinflaras un globo poco a poco.',
      'Repite tres veces. Esa sensación de tripa que empuja es tu apoyo.',
    ],
    consejo: 'Si solo se mueve el pecho, estás respirando "arriba": túmbate y respira así; el diafragma trabaja solo.',
  },
  {
    id: 'apoyo',
    titulo: 'El apoyo del aire',
    icono: '🎈',
    resumen: 'Cantar es soltar el aire con control, no empujarlo de golpe.',
    pasos: [
      'Inhala como en la respiración diafragmática.',
      'Canta una «u» suave y fíjate en la tripa: debe bajar despacio, sin hundirse de golpe.',
      'Si la nota tiembla o se cae, es que el aire se va demasiado rápido: frena con la tripa, no con la garganta.',
    ],
    consejo: 'Piensa en empujar el aire hacia abajo mientras la nota sale hacia delante.',
  },
  {
    id: 'resonancia',
    titulo: '¿De dónde sale la voz?',
    icono: '🗣️',
    resumen: 'La voz nace en la garganta pero suena en la cara: nariz, pómulos y frente.',
    pasos: [
      'Tararea una «mmm» con la boca cerrada y nota el cosquilleo en los labios y la nariz.',
      'Abre la boca sin dejar de sentir el cosquilleo: «mmm-aaa».',
      'Esa vibración delante es la resonancia: la voz suena más grande sin forzar.',
    ],
    consejo: 'Si te duele la garganta al cantar, la voz está demasiado atrás: busca el cosquilleo en la cara.',
  },
  {
    id: 'vibrato',
    titulo: 'Qué es el vibrato',
    icono: '〰️',
    resumen: 'Una ondulación suave y regular de la nota, que aparece cuando el aire fluye relajado.',
    pasos: [
      'Sostén una nota cómoda con buen apoyo.',
      'Deja que la nota oscile muy poquito arriba y abajo, unas 5 veces por segundo, sin moverla a propósito con la garganta.',
      'Si no sale, no lo fuerces: llega solo con el apoyo y la relajación.',
    ],
    consejo: 'El vibrato forzado suena a cabra; el natural, a cantante.',
  },
];

export function obtenerTecnica(id) {
  return TECNICAS.find((tecnica) => tecnica.id === id) ?? null;
}
