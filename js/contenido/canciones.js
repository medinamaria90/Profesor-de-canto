// Catálogo de canciones: originales de Alondra y melodías de dominio público (compositor fallecido antes de 1946).
// Cada canción está en grados (semitonos desde la tónica) y se transporta al rango vocal del usuario.
// notas: [[grado, pulsos]], frases: índices de nota donde empieza cada frase, acordes: [{ compas, grados }].

const ACORDE = {
  I: [0, 4, 7],
  ii: [2, 5, 9],
  IV: [5, 9, 12],
  V: [7, 11, 14],
  V7: [7, 11, 14, 17],
  vi: [9, 12, 16],
  Im: [0, 3, 7],
  IVm: [5, 8, 12],
  VI: [8, 12, 15],
  III: [3, 7, 10],
};

export const CANCIONES = [
  {
    id: 'primer-vuelo',
    titulo: 'Primer vuelo',
    origen: 'original',
    autor: 'Alondra',
    estilo: 'pop',
    tempo: 96,
    dificultad: 1,
    descripcion: 'Tres notas y un estribillo pegadizo para empezar a volar.',
    // Estrofa (frase 1 y 2) con Do-Re-Mi y estribillo (frase 3 y 4) que sube a Fa y Sol.
    notas: [
      [0, 1], [0, 1], [2, 1], [4, 1], [4, 2], [2, 2],
      [0, 1], [2, 1], [4, 1], [2, 1], [0, 4],
      [4, 1], [4, 1], [5, 1], [7, 1], [7, 2], [5, 2],
      [4, 1], [2, 1], [4, 1], [2, 1], [0, 4],
    ],
    frases: [0, 6, 11, 17],
    acordes: [
      { compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.IV }, { compas: 2, grados: ACORDE.V }, { compas: 3, grados: ACORDE.I },
      { compas: 4, grados: ACORDE.IV }, { compas: 5, grados: ACORDE.I }, { compas: 6, grados: ACORDE.V }, { compas: 7, grados: ACORDE.I },
    ],
  },
  {
    id: 'cumpleanos-feliz',
    titulo: 'Cumpleaños feliz',
    origen: 'tradicional',
    autor: 'Tradicional',
    estilo: 'balada',
    tempo: 100,
    dificultad: 2,
    descripcion: 'La de siempre, con su salto de octava en la tercera frase.',
    notas: [
      [0, 0.5], [0, 0.5], [2, 1], [0, 1], [5, 1], [4, 2],
      [0, 0.5], [0, 0.5], [2, 1], [0, 1], [7, 1], [5, 2],
      [0, 0.5], [0, 0.5], [12, 1], [9, 1], [5, 1], [4, 1], [2, 2],
      [10, 0.5], [10, 0.5], [9, 1], [5, 1], [7, 1], [5, 2],
    ],
    frases: [0, 6, 12, 19],
    acordes: [
      { compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.V7 }, { compas: 2, grados: ACORDE.I }, { compas: 3, grados: ACORDE.I },
      { compas: 4, grados: ACORDE.IV }, { compas: 5, grados: ACORDE.V7 }, { compas: 6, grados: ACORDE.I },
    ],
  },
  {
    id: 'fray-santiago',
    titulo: 'Fray Santiago',
    origen: 'tradicional',
    autor: 'Tradicional (Francia, s. XVIII)',
    estilo: 'balada',
    tempo: 108,
    dificultad: 1,
    descripcion: 'El canon de siempre, con notas repetidas y saltos pequeños.',
    notas: [[0, 1], [2, 1], [4, 1], [0, 1], [0, 1], [2, 1], [4, 1], [0, 1], [4, 1], [5, 1], [7, 2], [4, 1], [5, 1], [7, 2]],
    frases: [0, 4, 8, 11],
    acordes: [{ compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.I }, { compas: 2, grados: ACORDE.I }, { compas: 3, grados: ACORDE.V7 }],
  },
  {
    id: 'estrellita',
    titulo: 'Estrellita',
    origen: 'tradicional',
    autor: 'Tradicional (Francia, s. XVIII)',
    estilo: 'balada',
    tempo: 100,
    dificultad: 2,
    descripcion: 'Un salto de quinta al principio y una bajada por grados.',
    notas: [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]],
    frases: [0, 7],
    acordes: [{ compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.IV }, { compas: 2, grados: ACORDE.I }, { compas: 3, grados: ACORDE.V7 }],
  },
  {
    id: 'himno-alegria',
    titulo: 'Himno de la alegría',
    origen: 'dominio publico',
    autor: 'Ludwig van Beethoven (1770-1827)',
    estilo: 'balada',
    tempo: 112,
    dificultad: 2,
    descripcion: 'Beethoven, por grados conjuntos: perfecta para afinar.',
    notas: [[4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [4, 1.5], [2, 0.5], [2, 2]],
    frases: [0, 8],
    acordes: [{ compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.V }, { compas: 2, grados: ACORDE.I }, { compas: 3, grados: ACORDE.V }],
  },
  {
    id: 'por-una-cabeza',
    titulo: 'Por una cabeza',
    origen: 'dominio publico',
    autor: 'Carlos Gardel (1890-1935)',
    estilo: 'tango',
    tempo: 104,
    dificultad: 3,
    descripcion: 'El tango de Gardel: cromatismos y carácter.',
    notas: [
      [7, 0.5], [9, 0.5], [11, 0.5], [12, 1.5], [11, 0.5], [9, 0.5], [7, 1],
      [5, 0.5], [7, 0.5], [9, 0.5], [12, 1.5], [9, 0.5], [7, 0.5], [5, 1],
      [4, 0.5], [5, 0.5], [7, 0.5], [9, 1.5], [7, 0.5], [5, 0.5], [4, 1],
      [2, 0.5], [4, 0.5], [5, 0.5], [7, 2.5],
    ],
    frases: [0, 7, 14, 21],
    acordes: [{ compas: 0, grados: ACORDE.I }, { compas: 1, grados: ACORDE.IV }, { compas: 2, grados: ACORDE.V7 }, { compas: 3, grados: ACORDE.I }],
  },
  {
    id: 'summertime',
    titulo: 'Summertime',
    origen: 'dominio publico',
    autor: 'George Gershwin (1898-1937)',
    estilo: 'swing',
    tempo: 76,
    dificultad: 3,
    descripcion: 'Gershwin en modo menor: notas largas para lucir la voz.',
    notas: [[7, 2], [4, 1], [7, 1], [4, 2], [3, 1], [4, 1], [2, 1], [0, 1], [2, 1], [0, 1], [-5, 4]],
    frases: [0, 4, 7],
    acordes: [{ compas: 0, grados: ACORDE.Im }, { compas: 1, grados: ACORDE.Im }, { compas: 2, grados: ACORDE.IVm }, { compas: 3, grados: ACORDE.Im }],
  },
];

export function obtenerCancion(id) {
  return CANCIONES.find((cancion) => cancion.id === id) ?? null;
}

export function gradosDeCancion(cancion) {
  return cancion.notas.map(([grado]) => grado);
}

// Devuelve la lista de notas de una frase (índice de frase 0, 1, …).
export function notasDeFrase(cancion, indiceFrase) {
  const inicio = cancion.frases[indiceFrase];
  const fin = cancion.frases[indiceFrase + 1] ?? cancion.notas.length;
  return cancion.notas.slice(inicio, fin);
}

// Pulso absoluto en el que empieza una frase.
export function pulsoInicioFrase(cancion, indiceFrase) {
  return cancion.notas.slice(0, cancion.frases[indiceFrase]).reduce((suma, [, pulsos]) => suma + pulsos, 0);
}
