// Melodías y patrones expresados en grados (semitonos desde la nota base) y duraciones en pulsos.
// Cada nota es [grado, pulsos]; un grado null es un silencio.

export const ESCALA_TRES_NOTAS = { titulo: 'Tres notas', tempo: 80, notas: [[0, 1], [2, 1], [4, 2]] };
export const ESCALA_TRES_NOTAS_IDA_VUELTA = { titulo: 'Sube y baja', tempo: 84, notas: [[0, 1], [2, 1], [4, 1], [2, 1], [0, 2]] };
export const ESCALA_CINCO_NOTAS = { titulo: 'Escala de cinco', tempo: 90, notas: [[0, 1], [2, 1], [4, 1], [5, 1], [7, 2]] };
export const ESCALA_CINCO_IDA_VUELTA = {
  titulo: 'Cinco arriba, cinco abajo',
  tempo: 96,
  notas: [[0, 1], [2, 1], [4, 1], [5, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 2]],
};
export const ARPEGIO_MAYOR = { titulo: 'Arpegio mayor', tempo: 84, notas: [[0, 1], [4, 1], [7, 1], [4, 1], [0, 2]] };
export const ARPEGIO_OCTAVA = { titulo: 'Arpegio con octava', tempo: 84, notas: [[0, 1], [4, 1], [7, 1], [12, 2], [7, 1], [4, 1], [0, 2]] };
export const SALTO_QUINTA = { titulo: 'Salto de quinta', tempo: 76, notas: [[0, 1], [7, 2], [0, 1], [7, 2]] };
export const SALTO_CUARTA = { titulo: 'Salto de cuarta', tempo: 76, notas: [[0, 1], [5, 2], [0, 1], [5, 2]] };
export const SALTO_OCTAVA = { titulo: 'Salto de octava', tempo: 72, notas: [[0, 1], [12, 2], [0, 2]] };

export const DOS_NOTAS = { titulo: 'Dos notas', tempo: 72, notas: [[0, 2], [2, 2]] };
export const DOS_NOTAS_VUELTA = { titulo: 'Ida y vuelta', tempo: 76, notas: [[0, 1], [2, 1], [0, 2]] };

export const CUMPLEANOS_FELIZ = {
  titulo: 'Cumpleaños feliz',
  tempo: 100,
  notas: [[0, 0.5], [0, 0.5], [2, 1], [0, 1], [5, 1], [4, 2], [0, 0.5], [0, 0.5], [2, 1], [0, 1], [7, 1], [5, 2]],
};

export const FRAY_SANTIAGO = {
  titulo: 'Fray Santiago',
  tempo: 108,
  notas: [[0, 1], [2, 1], [4, 1], [0, 1], [0, 1], [2, 1], [4, 1], [0, 1], [4, 1], [5, 1], [7, 2], [4, 1], [5, 1], [7, 2]],
};

export const ESTRELLITA_PRIMERA_PARTE = {
  titulo: 'Estrellita (primera parte)',
  tempo: 104,
  notas: [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]],
};

export const ESTRELLITA_SEGUNDA_PARTE = {
  titulo: 'Estrellita (segunda parte)',
  tempo: 104,
  notas: [[7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2], [7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2]],
};

export const HIMNO_ALEGRIA = {
  titulo: 'Himno de la alegría',
  tempo: 112,
  notas: [
    [4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1],
    [0, 1], [0, 1], [2, 1], [4, 1], [4, 1.5], [2, 0.5], [2, 2],
  ],
};

export const CUCU_CANTABA_LA_RANA = {
  titulo: 'Cucú, cantaba la rana',
  tempo: 100,
  notas: [[7, 1], [4, 1], [7, 1], [4, 1], [7, 1], [7, 1], [9, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 2]],
};

export const DEBAJO_UN_BOTON = {
  titulo: 'Debajo un botón',
  tempo: 108,
  notas: [[4, 0.5], [4, 0.5], [4, 1], [5, 0.5], [4, 0.5], [2, 1], [2, 0.5], [2, 0.5], [2, 1], [4, 0.5], [2, 0.5], [0, 1]],
};

export function duracionTotalPulsos(melodia) {
  return melodia.notas.reduce((acumulado, [, pulsos]) => acumulado + pulsos, 0);
}

export function gradosDeMelodia(melodia) {
  return melodia.notas.filter(([grado]) => grado !== null).map(([grado]) => grado);
}
