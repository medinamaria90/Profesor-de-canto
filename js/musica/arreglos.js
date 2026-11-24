// Arreglos de piano al estilo de un profesor de canto: acordes en bloque en cada pulso (fuerte el primero),
// fundamental en la mano izquierda y un compás de entrada que da el tono y el tempo antes de cantar.
// Lógica pura: devuelve eventos con el pulso en el que suenan (0 = primer compás entero; negativos = entrada).

export const PULSOS_POR_COMPAS_POR_DEFECTO = 4;
const OCTAVA = 12;
const FUERTE = 1;
const DEBIL = 0.6;
const MEDIO = 0.8;

const acorde = (pulso, pulsos, acento = FUERTE) => ({ pulso, tonos: 'acorde', pulsos, acento });
const nota = (pulso, tono, pulsos, acento = FUERTE) => ({ pulso, tono, pulsos, acento });

// Cada estilo tiene un patrón por tipo de compás (pulsos por compás). bajo: mano izquierda (índice de nota del
// acorde); teclas: mano derecha. Si un estilo no tiene patrón para el compás, se usa el de bloque.
export const ESTILOS = {
  bloque: {
    4: {
      bajo: [nota(0, 0, 2), nota(2, 2, 2, MEDIO)],
      teclas: [acorde(0, 1), acorde(1, 1, DEBIL), acorde(2, 1, MEDIO), acorde(3, 1, DEBIL)],
    },
    3: {
      bajo: [nota(0, 0, 3)],
      teclas: [acorde(0, 1), acorde(1, 1, DEBIL), acorde(2, 1, DEBIL)],
    },
  },
  pop: {
    4: {
      bajo: [nota(0, 0, 1), nota(1.5, 2, 0.5, DEBIL), nota(2, 0, 1), nota(3, 2, 1, MEDIO)],
      teclas: [acorde(0, 1), acorde(1.5, 0.5, DEBIL), acorde(2, 1, MEDIO), acorde(3, 0.5, DEBIL), acorde(3.5, 0.5, DEBIL)],
    },
  },
  swing: {
    4: {
      bajo: [nota(0, 0, 1), nota(1, 1, 1, MEDIO), nota(2, 2, 1), nota(3, 1, 1, MEDIO)],
      teclas: [acorde(0, 1), acorde(1.66, 0.34, DEBIL), acorde(3, 0.66, MEDIO)],
    },
  },
  tango: {
    4: {
      bajo: [nota(0, 0, 1), nota(1, 2, 1, MEDIO), nota(2, 0, 1), nota(3, 2, 1, MEDIO)],
      teclas: [acorde(0, 0.5), acorde(1, 0.5, DEBIL), acorde(2, 0.5, MEDIO), acorde(3, 0.5, DEBIL), acorde(3.5, 0.5, DEBIL)],
    },
  },
};

function patronDe(nombreEstilo, pulsosPorCompas) {
  const estilo = ESTILOS[nombreEstilo] ?? ESTILOS.bloque;
  return estilo[pulsosPorCompas] ?? ESTILOS.bloque[pulsosPorCompas] ?? ESTILOS.bloque[PULSOS_POR_COMPAS_POR_DEFECTO];
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

// El acorde vigente en un punto es el último definido en ese compás y pulso o antes. Antes del primer compás
// (la entrada) suena el primero.
export function acordeVigente(acordes, compas, pulsoEnCompas = 0) {
  let vigente = acordes[0];
  for (const candidato of acordes) {
    const pulsoCandidato = candidato.pulso ?? 0;
    if (candidato.compas < compas || (candidato.compas === compas && pulsoCandidato <= pulsoEnCompas)) vigente = candidato;
  }
  return vigente;
}

// acordes: [{ compas, pulso?, grados: [0, 4, 7] }] (grados relativos a la nota base de la canción).
// Devuelve { bajo: [{ pulso, grado, pulsos, acento }], acordes: [{ pulso, grados, pulsos, acento }] }, con un
// compás de entrada (pulsos negativos) que repite el patrón sobre el primer acorde.
export function generarArreglo(acordes, totalCompases, nombreEstilo, pulsosPorCompas = PULSOS_POR_COMPAS_POR_DEFECTO) {
  const patron = patronDe(nombreEstilo, pulsosPorCompas);
  const bajo = [];
  const acordesEventos = [];
  for (let compas = -1; compas < totalCompases; compas++) {
    const inicio = compas * pulsosPorCompas;
    for (const evento of patron.bajo) {
      const vigente = acordeVigente(acordes, compas, evento.pulso);
      bajo.push({ pulso: inicio + evento.pulso, grado: tonoDeAcorde(vigente.grados, evento.tono) - OCTAVA, pulsos: evento.pulsos, acento: evento.acento });
    }
    for (const evento of patron.teclas) {
      const vigente = acordeVigente(acordes, compas, evento.pulso);
      acordesEventos.push({ pulso: inicio + evento.pulso, grados: vigente.grados, pulsos: evento.pulsos, acento: evento.acento });
    }
  }
  return { bajo, acordes: acordesEventos };
}

// Compases enteros que ocupa una melodía, descontando la anacrusa (las notas antes del primer compás).
export function compasesDeMelodia(notas, pulsosPorCompas = PULSOS_POR_COMPAS_POR_DEFECTO, anacrusa = 0) {
  const pulsos = notas.reduce((acumulado, [, duracion]) => acumulado + duracion, 0);
  return Math.max(1, Math.ceil((pulsos - anacrusa) / pulsosPorCompas));
}
