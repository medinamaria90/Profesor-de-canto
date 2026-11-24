// Catálogo de canciones: originales de Alondra y melodías de dominio público (compositor fallecido antes de 1946).
// Cada canción está en grados (semitonos desde la tónica) y se transporta al rango vocal del usuario.
// notas: [[grado, pulsos]], frases: índices de nota donde empieza cada frase (respiraciones), acordes: [{ compas, grados }].

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
    descripcion: 'Cinco notas y un estribillo.',
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
    descripcion: 'Con salto de octava.',
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
    descripcion: 'Saltos pequeños.',
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
    descripcion: 'Salto de quinta y bajada.',
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
    descripcion: 'Por grados conjuntos.',
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
    descripcion: 'Cromatismos.',
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
    descripcion: 'Modo menor, notas largas.',
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
