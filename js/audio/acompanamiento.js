// Programa la orquestación de una canción (acordes, bajo y percusión) a partir de su arreglo.

import { generarArreglo, PULSOS_POR_COMPAS } from '../musica/arreglos.js';
import { padAcorde, bajo, percusion } from './instrumentos.js';
import { segundosPorPulso } from './sintetizador.js';

const SOLAPE_ACORDE = 0.95;

// cancion: { notas: [{ midi, pulsos }], acordes: [{ compas, midis }], tempo, estilo }
// Devuelve { duracion, detener() }.
export function reproducirAcompanamiento(contexto, cancion, { cuando = contexto.currentTime, ganancia = 1, compases } = {}) {
  const pulso = segundosPorPulso(cancion.tempo);
  const totalCompases = compases ?? Math.ceil(cancion.notas.reduce((suma, nota) => suma + nota.pulsos, 0) / PULSOS_POR_COMPAS);
  const acordesRelativos = cancion.acordes.map((acorde) => ({ compas: acorde.compas, grados: acorde.midis }));
  const arreglo = generarArreglo(acordesRelativos, totalCompases, cancion.estilo);
  const voces = [];
  for (const evento of arreglo.acordes) {
    voces.push(padAcorde(contexto, evento.grados, evento.pulsos * pulso * SOLAPE_ACORDE, { cuando: cuando + evento.pulso * pulso, ganancia: 0.05 * ganancia }));
  }
  for (const evento of arreglo.bajo) {
    voces.push(bajo(contexto, evento.grado, evento.pulsos * pulso * 0.9, { cuando: cuando + evento.pulso * pulso, ganancia: 0.16 * ganancia }));
  }
  for (const evento of arreglo.percusion) {
    voces.push(percusion(contexto, evento.tipo, { cuando: cuando + evento.pulso * pulso, ganancia: 0.12 * ganancia }));
  }
  return {
    duracion: totalCompases * PULSOS_POR_COMPAS * pulso,
    detener() {
      for (const voz of voces) {
        for (const nodo of voz.nodos) {
          try {
            nodo.stop();
          } catch (error) {
            if (error.name !== 'InvalidStateError') throw error;
          }
        }
        voz.salida.disconnect();
      }
      voces.length = 0;
    },
  };
}
