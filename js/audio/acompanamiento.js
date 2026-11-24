// Programa la orquestación de una canción (piano, cuerdas, bajo y percusión) a partir de su arreglo.

import { generarArreglo, colocarEnRegistro, PULSOS_POR_COMPAS } from '../musica/arreglos.js';
import { piano, cuerdas, bajo, percusion } from './instrumentos.js';
import { segundosPorPulso } from './sintetizador.js';

// Cada instrumento vive en su registro, sea cual sea la voz del usuario: la fundamental del acorde cae en estas notas MIDI.
const REGISTRO_PIANO = { minimo: 52, maximo: 63 }; // Mi3 a Mi♭4
const REGISTRO_CUERDAS = { minimo: 57, maximo: 68 };
const REGISTRO_BAJO = { minimo: 36, maximo: 47 }; // Do2 a Si2
const SOLAPE_PIANO = 1.1; // las notas del piano se pisan un poco, como con pedal
const GANANCIA_PIANO = 0.17;
const GANANCIA_CUERDAS = 0.045;
const GANANCIA_BAJO = 0.22;
const GANANCIA_PERCUSION = 0.08;

// acompanamiento: { acordes: [{ compas, midis }], tempo, estilo, compasInicio, compases }
// Devuelve { duracion, detener() }.
export function reproducirAcompanamiento(contexto, acompanamiento, { cuando = contexto.currentTime, ganancia = 1 } = {}) {
  const pulso = segundosPorPulso(acompanamiento.tempo);
  const totalCompases = acompanamiento.compases;
  const acordesRelativos = acompanamiento.acordes.map((acorde) => ({ compas: acorde.compas, grados: acorde.midis }));
  const arreglo = generarArreglo(acordesRelativos, totalCompases, acompanamiento.estilo, acompanamiento.compasInicio ?? 0);
  const voces = [];
  for (const evento of arreglo.acordes) {
    const midis = colocarEnRegistro(evento.grados, REGISTRO_PIANO.minimo, REGISTRO_PIANO.maximo);
    voces.push(piano(contexto, midis, evento.pulsos * pulso * SOLAPE_PIANO, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_PIANO * ganancia }));
  }
  for (const evento of arreglo.cuerdas) {
    const midis = colocarEnRegistro(evento.grados, REGISTRO_CUERDAS.minimo, REGISTRO_CUERDAS.maximo);
    voces.push(cuerdas(contexto, midis, evento.pulsos * pulso, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_CUERDAS * ganancia }));
  }
  for (const evento of arreglo.bajo) {
    const [midi] = colocarEnRegistro([evento.grado], REGISTRO_BAJO.minimo, REGISTRO_BAJO.maximo);
    voces.push(bajo(contexto, midi, evento.pulsos * pulso * 0.95, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_BAJO * ganancia }));
  }
  for (const evento of arreglo.percusion) {
    voces.push(percusion(contexto, evento.tipo, { cuando: cuando + evento.pulso * pulso, ganancia: GANANCIA_PERCUSION * ganancia }));
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
