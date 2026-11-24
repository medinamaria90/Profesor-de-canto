// Programa el acompañamiento de piano de una canción (mano izquierda y mano derecha) a partir de su arreglo.
// `cuando` es el primer compás entero; el compás de entrada suena antes.

import { generarArreglo, colocarEnRegistro } from '../musica/arreglos.js';
import { piano } from './instrumentos.js';
import { segundosPorPulso } from './sintetizador.js';

// Cada mano vive en su registro, sea cual sea la voz del usuario: la fundamental del acorde cae en estas notas MIDI.
const REGISTRO_DERECHA = { minimo: 52, maximo: 63 }; // Mi3 a Mi♭4
const REGISTRO_IZQUIERDA = { minimo: 36, maximo: 47 }; // Do2 a Si2
const SOLAPE_DERECHA = 1.05; // las notas se pisan un poco, como con pedal
const SOLAPE_IZQUIERDA = 0.95;
const GANANCIA_DERECHA = 0.2;
const GANANCIA_IZQUIERDA = 0.26;

// acompanamiento: { acordes: [{ compas, pulso?, midis }], tempo, estilo, pulsosPorCompas, compases }
// Devuelve { duracion (desde el primer compás entero), detener() }.
export function reproducirAcompanamiento(contexto, acompanamiento, { cuando = contexto.currentTime, ganancia = 1 } = {}) {
  const pulso = segundosPorPulso(acompanamiento.tempo);
  const acordesRelativos = acompanamiento.acordes.map((acorde) => ({ compas: acorde.compas, pulso: acorde.pulso, grados: acorde.midis }));
  const arreglo = generarArreglo(acordesRelativos, acompanamiento.compases, acompanamiento.estilo, acompanamiento.pulsosPorCompas);
  const voces = [];
  for (const evento of arreglo.acordes) {
    const midis = colocarEnRegistro(evento.grados, REGISTRO_DERECHA.minimo, REGISTRO_DERECHA.maximo);
    voces.push(piano(contexto, midis, evento.pulsos * pulso * SOLAPE_DERECHA, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_DERECHA * evento.acento * ganancia }));
  }
  for (const evento of arreglo.bajo) {
    const midis = colocarEnRegistro([evento.grado], REGISTRO_IZQUIERDA.minimo, REGISTRO_IZQUIERDA.maximo);
    voces.push(piano(contexto, midis, evento.pulsos * pulso * SOLAPE_IZQUIERDA, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_IZQUIERDA * evento.acento * ganancia }));
  }
  return {
    duracion: acompanamiento.compases * acompanamiento.pulsosPorCompas * pulso,
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
