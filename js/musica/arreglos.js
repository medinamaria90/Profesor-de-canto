// Arreglos: convierte los acordes y el estilo de una canción en eventos de bajo, acorde y percusión.
// Lógica pura: devuelve listas de eventos con el pulso en el que suenan; el audio los programa después.

export const ESTILOS = {
  pop: { bajoPorPulso: [1, 0, 1, 0], acordePorPulso: [1, 0, 1, 1], bombo: [0, 2], caja: [1, 3], charles: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
  balada: { bajoPorPulso: [1, 0, 0, 0], acordePorPulso: [1, 0, 0, 0], bombo: [0], caja: [2], charles: [0, 1, 2, 3] },
  swing: { bajoPorPulso: [1, 1, 1, 1], acordePorPulso: [0, 1, 0, 1], bombo: [0, 2], caja: [], charles: [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66] },
  tango: { bajoPorPulso: [1, 0, 1, 1], acordePorPulso: [1, 1, 1, 1], bombo: [0, 2.5], caja: [1, 3], charles: [] },
};

export const PULSOS_POR_COMPAS = 4;
// El bajo suena una octava por debajo de la fundamental del acorde.
const OCTAVA = 12;

function estiloDe(nombre) {
  return ESTILOS[nombre] ?? ESTILOS.pop;
}

// acordes: [{ compas, grados: [0, 4, 7] }] (grados relativos a la nota base de la canción).
// Devuelve { bajo: [{ pulso, grado, pulsos }], acordes: [{ pulso, grados, pulsos }], percusion: [{ pulso, tipo }] }
export function generarArreglo(acordes, totalCompases, nombreEstilo) {
  const estilo = estiloDe(nombreEstilo);
  const bajo = [];
  const acordesEventos = [];
  const percusion = [];
  for (let compas = 0; compas < totalCompases; compas++) {
    const acorde = acordeEnCompas(acordes, compas);
    const inicio = compas * PULSOS_POR_COMPAS;
    estilo.bajoPorPulso.forEach((suena, pulso) => {
      if (suena) bajo.push({ pulso: inicio + pulso, grado: acorde.grados[0] - OCTAVA, pulsos: 1 });
    });
    estilo.acordePorPulso.forEach((suena, pulso) => {
      if (suena) acordesEventos.push({ pulso: inicio + pulso, grados: acorde.grados, pulsos: 1 });
    });
    for (const pulso of estilo.bombo) percusion.push({ pulso: inicio + pulso, tipo: 'bombo' });
    for (const pulso of estilo.caja) percusion.push({ pulso: inicio + pulso, tipo: 'caja' });
    for (const pulso of estilo.charles) percusion.push({ pulso: inicio + pulso, tipo: 'charles' });
  }
  return { bajo, acordes: acordesEventos, percusion };
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
