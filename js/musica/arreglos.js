// Arreglos: convierte los acordes y el estilo de una canción en lo que toca cada instrumento.
// Lógica pura: devuelve listas de eventos con el pulso en el que suenan; el audio los programa después.

export const PULSOS_POR_COMPAS = 4;
const OCTAVA = 12;

// Un arpegio recorre las notas del acorde (índice 3 = la fundamental una octava arriba, etc.) en corcheas.
function arpegio(indices) {
  return indices.map((tono, posicion) => ({ pulso: posicion * 0.5, tonos: [tono], pulsos: 0.5 }));
}

const acorde = (pulso, pulsos) => ({ pulso, tonos: 'acorde', pulsos });
const nota = (pulso, tono, pulsos) => ({ pulso, tono, pulsos });
const SIN_PERCUSION = { bombo: [], caja: [], charles: [] };

// bajo: nota del acorde (índice) en cada pulso; teclas: acordes o arpegios del piano; cuerdas: colchón largo o no.
export const ESTILOS = {
  pop: {
    bajo: [nota(0, 0, 1), nota(2, 0, 1), nota(3.5, 2, 0.5)],
    teclas: [acorde(0, 1), acorde(1.5, 0.5), acorde(2, 1), acorde(3, 0.5), acorde(3.5, 0.5)],
    cuerdas: false,
    percusion: { bombo: [0, 2], caja: [1, 3], charles: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
  },
  balada: {
    bajo: [nota(0, 0, 2), nota(2, 2, 2)],
    teclas: arpegio([0, 2, 3, 4, 3, 2, 0, 2]),
    cuerdas: true,
    percusion: SIN_PERCUSION,
  },
  swing: {
    bajo: [nota(0, 0, 1), nota(1, 1, 1), nota(2, 2, 1), nota(3, 1, 1)],
    teclas: [acorde(0, 1), acorde(1.66, 0.34), acorde(3, 0.66)],
    cuerdas: false,
    percusion: { bombo: [], caja: [], charles: [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66] },
  },
  tango: {
    bajo: [nota(0, 0, 1), nota(1, 2, 1), nota(2, 0, 1), nota(3, 2, 1)],
    teclas: [acorde(1, 0.5), acorde(2, 0.5), acorde(3, 0.5), acorde(3.5, 0.5)],
    cuerdas: true,
    percusion: SIN_PERCUSION,
  },
};

function estiloDe(nombre) {
  return ESTILOS[nombre] ?? ESTILOS.pop;
}

// Nota del acorde por índice: pasado el último grado, se sigue una octava más arriba.
export function tonoDeAcorde(grados, indice) {
  return grados[indice % grados.length] + OCTAVA * Math.floor(indice / grados.length);
}

// Desplaza un acorde entero por octavas hasta que su fundamental cae en el registro pedido (la forma no cambia).
export function colocarEnRegistro(midis, minimoFundamental, maximoFundamental) {
  const fundamental = midis[0];
  let desplazamiento = 0;
  while (fundamental + desplazamiento < minimoFundamental) desplazamiento += OCTAVA;
  while (fundamental + desplazamiento > maximoFundamental) desplazamiento -= OCTAVA;
  return midis.map((midi) => midi + desplazamiento);
}

// acordes: [{ compas, grados: [0, 4, 7] }] (grados relativos a la nota base de la canción).
// Devuelve { bajo: [{ pulso, grado, pulsos }], acordes: [{ pulso, grados, pulsos }], cuerdas: [{ pulso, grados, pulsos }], percusion: [{ pulso, tipo }] }
// compasInicio permite arrancar en mitad de la canción (los pulsos devueltos son relativos a ese compás).
export function generarArreglo(acordes, totalCompases, nombreEstilo, compasInicio = 0) {
  const estilo = estiloDe(nombreEstilo);
  const bajo = [];
  const acordesEventos = [];
  const cuerdas = [];
  const percusion = [];
  for (let indice = 0; indice < totalCompases; indice++) {
    const vigente = acordeEnCompas(acordes, compasInicio + indice);
    const inicio = indice * PULSOS_POR_COMPAS;
    for (const evento of estilo.bajo) {
      bajo.push({ pulso: inicio + evento.pulso, grado: tonoDeAcorde(vigente.grados, evento.tono) - OCTAVA, pulsos: evento.pulsos });
    }
    for (const evento of estilo.teclas) {
      const grados = evento.tonos === 'acorde' ? vigente.grados : evento.tonos.map((tono) => tonoDeAcorde(vigente.grados, tono));
      acordesEventos.push({ pulso: inicio + evento.pulso, grados, pulsos: evento.pulsos });
    }
    if (estilo.cuerdas) cuerdas.push({ pulso: inicio, grados: vigente.grados, pulsos: PULSOS_POR_COMPAS });
    for (const pulso of estilo.percusion.bombo) percusion.push({ pulso: inicio + pulso, tipo: 'bombo' });
    for (const pulso of estilo.percusion.caja) percusion.push({ pulso: inicio + pulso, tipo: 'caja' });
    for (const pulso of estilo.percusion.charles) percusion.push({ pulso: inicio + pulso, tipo: 'charles' });
  }
  return { bajo, acordes: acordesEventos, cuerdas, percusion };
}

// El acorde vigente en un compás es el último definido en ese compás o antes.
export function acordeEnCompas(acordes, compas) {
  let vigente = acordes[0];
  for (const acorde of acordes) {
    if (acorde.compas <= compas) vigente = acorde;
  }
  return vigente;
}

export function compasesDeMelodia(notas) {
  const pulsos = notas.reduce((acumulado, [, duracion]) => acumulado + duracion, 0);
  return Math.ceil(pulsos / PULSOS_POR_COMPAS);
}
