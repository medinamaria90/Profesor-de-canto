// Catálogo de canciones: originales de Alondra y melodías de dominio público (compositor fallecido antes de 1946).
// Cada canción está en grados (semitonos desde su primera nota de referencia) y se transporta al rango vocal.
// notas: [[grado, pulsos]]; pulsosPorCompas: 3 o 4; anacrusa: pulsos de notas antes del primer compás entero;
// tonica: grado de la tónica (los acordes se construyen sobre ella); frases: índices de nota donde se respira;
// acordes: [{ compas, pulso?, grados }], con el compás 0 en el primer compás entero.

const ACORDE = {
  I: [0, 4, 7],
  IV: [5, 9, 12],
  V: [7, 11, 14],
  V7: [7, 11, 14, 17],
  Im: [0, 3, 7],
  IVm: [5, 8, 12],
};

const acorde = (compas, grados, pulso = 0) => ({ compas, pulso, grados });

export const CANCIONES = [
  {
    id: 'primer-vuelo',
    titulo: 'Primer vuelo',
    origen: 'original',
    autor: 'Alondra',
    estilo: 'pop',
    tempo: 96,
    pulsosPorCompas: 4,
    anacrusa: 0,
    tonica: 0,
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
      acorde(0, ACORDE.I), acorde(1, ACORDE.V), acorde(2, ACORDE.I), acorde(3, ACORDE.I),
      acorde(4, ACORDE.I), acorde(4, ACORDE.V7, 2), acorde(5, ACORDE.V7), acorde(6, ACORDE.I), acorde(6, ACORDE.V, 2), acorde(7, ACORDE.I),
    ],
  },
  {
    id: 'cumpleanos-feliz',
    titulo: 'Cumpleaños feliz',
    origen: 'tradicional',
    autor: 'Tradicional',
    estilo: 'bloque',
    tempo: 108,
    pulsosPorCompas: 3,
    anacrusa: 1,
    // Empieza en la dominante («Cum-ple»); la tónica está una cuarta por encima.
    tonica: 5,
    dificultad: 2,
    descripcion: 'Vals, con salto de octava.',
    notas: [
      [0, 0.5], [0, 0.5], [2, 1], [0, 1], [5, 1], [4, 2],
      [0, 0.5], [0, 0.5], [2, 1], [0, 1], [7, 1], [5, 2],
      [0, 0.5], [0, 0.5], [12, 1], [9, 1], [5, 1], [4, 1], [2, 1],
      [10, 0.5], [10, 0.5], [9, 1], [5, 1], [7, 1], [5, 2],
    ],
    frases: [0, 6, 12, 19],
    acordes: [
      acorde(0, ACORDE.I), acorde(1, ACORDE.V7), acorde(2, ACORDE.V7), acorde(3, ACORDE.I),
      acorde(4, ACORDE.I), acorde(5, ACORDE.IV), acorde(6, ACORDE.I), acorde(6, ACORDE.V7, 2), acorde(7, ACORDE.I),
    ],
  },
  {
    id: 'fray-santiago',
    titulo: 'Fray Santiago',
    origen: 'tradicional',
    autor: 'Tradicional (Francia, s. XVIII)',
    estilo: 'bloque',
    tempo: 104,
    pulsosPorCompas: 4,
    anacrusa: 0,
    tonica: 0,
    dificultad: 1,
    descripcion: 'Saltos pequeños.',
    notas: [[0, 1], [2, 1], [4, 1], [0, 1], [0, 1], [2, 1], [4, 1], [0, 1], [4, 1], [5, 1], [7, 2], [4, 1], [5, 1], [7, 2]],
    frases: [0, 4, 8, 11],
    acordes: [acorde(0, ACORDE.I)],
  },
  {
    id: 'estrellita',
    titulo: 'Estrellita',
    origen: 'tradicional',
    autor: 'Tradicional (Francia, s. XVIII)',
    estilo: 'bloque',
    tempo: 96,
    pulsosPorCompas: 4,
    anacrusa: 0,
    tonica: 0,
    dificultad: 2,
    descripcion: 'Salto de quinta y bajada.',
    notas: [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]],
    frases: [0, 7],
    acordes: [acorde(0, ACORDE.I), acorde(1, ACORDE.IV), acorde(1, ACORDE.I, 2), acorde(2, ACORDE.IV), acorde(2, ACORDE.I, 2), acorde(3, ACORDE.V7), acorde(3, ACORDE.I, 2)],
  },
  {
    id: 'himno-alegria',
    titulo: 'Himno de la alegría',
    origen: 'dominio publico',
    autor: 'Ludwig van Beethoven (1770-1827)',
    estilo: 'bloque',
    tempo: 108,
    pulsosPorCompas: 4,
    anacrusa: 0,
    tonica: 0,
    dificultad: 2,
    descripcion: 'Por grados conjuntos.',
    notas: [[4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [4, 1.5], [2, 0.5], [2, 2]],
    frases: [0, 8],
    acordes: [acorde(0, ACORDE.I), acorde(1, ACORDE.I), acorde(1, ACORDE.V, 2), acorde(2, ACORDE.I), acorde(3, ACORDE.V), acorde(3, ACORDE.I, 2)],
  },
  {
    id: 'por-una-cabeza',
    titulo: 'Por una cabeza',
    origen: 'dominio publico',
    autor: 'Carlos Gardel (1890-1935)',
    estilo: 'tango',
    tempo: 100,
    pulsosPorCompas: 4,
    anacrusa: 1,
    tonica: 0,
    dificultad: 3,
    descripcion: 'Cromatismos.',
    // Cada frase entra con tres notas rápidas («Por u-na») antes del compás.
    notas: [
      [7, 0.33], [9, 0.33], [11, 0.34], [12, 1.5], [11, 0.5], [9, 0.5], [7, 0.5],
      [5, 0.33], [7, 0.33], [9, 0.34], [12, 1.5], [9, 0.5], [7, 0.5], [5, 0.5],
      [4, 0.33], [5, 0.33], [7, 0.34], [9, 1.5], [7, 0.5], [5, 0.5], [4, 0.5],
      [2, 0.33], [4, 0.33], [5, 0.34], [7, 3],
    ],
    frases: [0, 7, 14, 21],
    acordes: [acorde(0, ACORDE.I), acorde(1, ACORDE.V7), acorde(2, ACORDE.V7), acorde(3, ACORDE.I)],
  },
  {
    id: 'summertime',
    titulo: 'Summertime',
    origen: 'dominio publico',
    autor: 'George Gershwin (1898-1937)',
    estilo: 'swing',
    tempo: 76,
    pulsosPorCompas: 4,
    anacrusa: 0,
    tonica: 0,
    dificultad: 3,
    descripcion: 'Modo menor, notas largas.',
    notas: [[7, 2], [4, 1], [7, 1], [4, 2], [3, 1], [4, 1], [2, 1], [0, 1], [2, 1], [0, 1], [-5, 4]],
    frases: [0, 4, 7],
    acordes: [acorde(0, ACORDE.Im), acorde(1, ACORDE.Im), acorde(2, ACORDE.IVm), acorde(3, ACORDE.Im)],
  },
];

export function obtenerCancion(id) {
  return CANCIONES.find((cancion) => cancion.id === id) ?? null;
}

export function gradosDeCancion(cancion) {
  return cancion.notas.map(([grado]) => grado);
}
