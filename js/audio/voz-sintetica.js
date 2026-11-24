// Voz sintética para imitar los gestos de un cantante: una fuente glótica (diente de sierra) pasada por
// filtros de formantes, más ruido para siseos y soplos. No pretende cantar: sirve para que se oiga
// cómo suena un «mmm», un trino de labios o una vocal y copiarlo.

import { midiAFrecuencia } from '../musica/notas.js';
import { conectarAMesa } from './mezcla.js';

const CENTS_POR_OCTAVA = 1200;
const MARGEN_PARADA = 0.05;
const RUIDO_SEGUNDOS = 2;
const ENVIO_REVERB = 0.2;

// Formantes aproximados (Hz) de una voz media. Cada vocal: [F1, F2, F3] y su ganancia relativa.
export const FORMANTES = {
  a: { frecuencias: [750, 1200, 2600], ganancias: [1, 0.5, 0.2] },
  e: { frecuencias: [450, 1900, 2600], ganancias: [1, 0.4, 0.2] },
  i: { frecuencias: [300, 2300, 3000], ganancias: [1, 0.25, 0.15] },
  o: { frecuencias: [450, 800, 2500], ganancias: [1, 0.6, 0.12] },
  u: { frecuencias: [320, 700, 2400], ganancias: [1, 0.5, 0.08] },
  // Boca cerrada: solo pasa lo grave y un poco de nasalidad.
  m: { frecuencias: [250, 1000, 2200], ganancias: [1, 0.08, 0.03] },
  // «ng»: nasal con algo más de brillo que la «m».
  ng: { frecuencias: [280, 1300, 2300], ganancias: [1, 0.15, 0.08] },
};
const ANCHO_FORMANTE = 1 / 10; // Q ≈ 10

let bufferRuido = null;

export function obtenerRuido(contexto) {
  if (bufferRuido) return bufferRuido;
  const muestras = contexto.sampleRate * RUIDO_SEGUNDOS;
  bufferRuido = contexto.createBuffer(1, muestras, contexto.sampleRate);
  const datos = bufferRuido.getChannelData(0);
  for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;
  return bufferRuido;
}

// Crea los filtros de una vocal; devuelve { entrada, salida, fijarVocal(vocal, cuando, transicion) }.
export function crearTractoVocal(contexto, vocalInicial = 'a') {
  const entrada = contexto.createGain();
  const salida = contexto.createGain();
  const inicial = FORMANTES[vocalInicial];
  const bandas = inicial.frecuencias.map((frecuencia, indice) => {
    const filtro = contexto.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = frecuencia;
    filtro.Q.value = 1 / ANCHO_FORMANTE;
    const ganancia = contexto.createGain();
    ganancia.gain.value = inicial.ganancias[indice];
    entrada.connect(filtro).connect(ganancia).connect(salida);
    return { filtro, ganancia };
  });
  return {
    entrada,
    salida,
    fijarVocal(vocal, cuando, transicion = 0.08) {
      const objetivo = FORMANTES[vocal];
      bandas.forEach(({ filtro, ganancia }, indice) => {
        filtro.frequency.setTargetAtTime(objetivo.frecuencias[indice], cuando, transicion / 3);
        ganancia.gain.setTargetAtTime(objetivo.ganancias[indice], cuando, transicion / 3);
      });
    },
  };
}

// Fuente glótica: diente de sierra con vibrato opcional. Devuelve { oscilador, vibrato, fijarAltura(midi, cuando, deslizar) }.
export function crearFuenteGlotica(contexto, midi, { cuando, vibratoCents = 0, vibratoHz = 5.5 } = {}) {
  const oscilador = contexto.createOscillator();
  oscilador.type = 'sawtooth';
  oscilador.frequency.setValueAtTime(midiAFrecuencia(midi), cuando);
  const vibrato = contexto.createOscillator();
  vibrato.frequency.value = vibratoHz;
  const profundidad = contexto.createGain();
  profundidad.gain.value = 0;
  vibrato.connect(profundidad).connect(oscilador.frequency);
  if (vibratoCents > 0) profundidad.gain.setValueAtTime(midiAFrecuencia(midi) * (2 ** (vibratoCents / CENTS_POR_OCTAVA) - 1), cuando);
  return {
    oscilador,
    vibrato,
    profundidad,
    fijarAltura(nuevoMidi, enCuando, deslizar = 0) {
      const frecuencia = midiAFrecuencia(nuevoMidi);
      if (deslizar > 0) oscilador.frequency.exponentialRampToValueAtTime(frecuencia, enCuando + deslizar);
      else oscilador.frequency.setValueAtTime(frecuencia, enCuando);
    },
    fijarVibrato(cents, enCuando, transicion = 0.4) {
      profundidad.gain.setTargetAtTime(midiAFrecuencia(midi) * (2 ** (cents / CENTS_POR_OCTAVA) - 1), enCuando, transicion / 3);
    },
  };
}

// Envolvente de amplitud con ataque y liberación; devuelve el nodo de ganancia.
export function crearEnvolvente(contexto, ganancia, cuando, duracion, { ataque = 0.05, liberacion = 0.15 } = {}) {
  const nodo = contexto.createGain();
  const fin = cuando + duracion;
  nodo.gain.setValueAtTime(0, cuando);
  nodo.gain.linearRampToValueAtTime(ganancia, cuando + ataque);
  nodo.gain.setValueAtTime(ganancia, Math.max(cuando + ataque, fin - liberacion));
  nodo.gain.linearRampToValueAtTime(0, fin);
  return nodo;
}

// Ruido filtrado (siseos, soplos). Devuelve { fuente, salida }.
export function crearRuido(contexto, { tipo = 'highpass', frecuencia = 5000, q = 0.7, cuando, duracion }) {
  const fuente = contexto.createBufferSource();
  fuente.buffer = obtenerRuido(contexto);
  fuente.loop = true;
  const filtro = contexto.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = frecuencia;
  filtro.Q.value = q;
  fuente.connect(filtro);
  fuente.start(cuando);
  fuente.stop(cuando + duracion + MARGEN_PARADA);
  return { fuente, salida: filtro };
}

// Conecta la salida final a la mesa y devuelve el objeto estándar { nodos, salida } para poder parar.
export function terminarVoz(contexto, salida, nodos, fin) {
  conectarAMesa(contexto, salida, ENVIO_REVERB);
  for (const nodo of nodos) {
    if (typeof nodo.stop === 'function') nodo.stop(fin + MARGEN_PARADA);
  }
  return { nodos, salida };
}
