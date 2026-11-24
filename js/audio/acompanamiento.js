// Programa el acompañamiento de piano de una canción (mano izquierda y mano derecha) a partir de su arreglo.

import { generarArreglo, colocarEnRegistro, PULSOS_POR_COMPAS } from '../musica/arreglos.js';
import { piano } from './instrumentos.js';
import { segundosPorPulso } from './sintetizador.js';

// Cada mano vive en su registro, sea cual sea la voz del usuario: la fundamental del acorde cae en estas notas MIDI.
const REGISTRO_DERECHA = { minimo: 52, maximo: 63 }; // Mi3 a Mi♭4
const REGISTRO_IZQUIERDA = { minimo: 36, maximo: 47 }; // Do2 a Si2
const SOLAPE_DERECHA = 1.1; // las notas se pisan un poco, como con pedal
const SOLAPE_IZQUIERDA = 0.95;
const GANANCIA_DERECHA = 0.2;
const GANANCIA_IZQUIERDA = 0.26;

// acompanamiento: { acordes: [{ compas, midis }], tempo, estilo, compasInicio, compases }
// Devuelve { duracion, detener() }.
export function reproducirAcompanamiento(contexto, acompanamiento, { cuando = contexto.currentTime, ganancia = 1 } = {}) {
  const pulso = segundosPorPulso(acompanamiento.tempo);
  const totalCompases = acompanamiento.compases;
  const acordesRelativos = acompanamiento.acordes.map((acorde) => ({ compas: acorde.compas, grados: acorde.midis }));
  const arreglo = generarArreglo(acordesRelativos, totalCompases, acompanamiento.estilo, acompanamiento.compasInicio ?? 0);
  const voces = [];
  for (const evento of arreglo.acordes) {
    const midis = colocarEnRegistro(evento.grados, REGISTRO_DERECHA.minimo, REGISTRO_DERECHA.maximo);
    voces.push(piano(contexto, midis, evento.pulsos * pulso * SOLAPE_DERECHA, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_DERECHA * ganancia }));
  }
  for (const evento of arreglo.bajo) {
    const midis = colocarEnRegistro([evento.grado], REGISTRO_IZQUIERDA.minimo, REGISTRO_IZQUIERDA.maximo);
    voces.push(piano(contexto, midis, evento.pulsos * pulso * SOLAPE_IZQUIERDA, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_IZQUIERDA * ganancia }));
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
