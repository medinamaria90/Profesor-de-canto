// Instrumentos sintetizados: voz guía, pad de acordes, bajo y percusión. Cada función programa un sonido
// en el contexto y lo devuelve para poder pararlo.

import { midiAFrecuencia } from '../musica/notas.js';

const ATAQUE = 0.03;
const LIBERACION = 0.15;
const MARGEN_PARADA = 0.05;
const RUIDO_SEGUNDOS = 1;
const VIBRATO_HZ = 5.5;
const VIBRATO_CENTS = 6;
const CENTS_POR_OCTAVA = 1200;

let bufferRuido = null;

function obtenerRuido(contexto) {
  if (bufferRuido) return bufferRuido;
  const muestras = contexto.sampleRate * RUIDO_SEGUNDOS;
  bufferRuido = contexto.createBuffer(1, muestras, contexto.sampleRate);
  const datos = bufferRuido.getChannelData(0);
  for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;
  return bufferRuido;
}

function envolvente(contexto, ganancia, cuando, duracion, { ataque = ATAQUE, liberacion = LIBERACION } = {}) {
  const nodo = contexto.createGain();
  const fin = cuando + duracion;
  nodo.gain.setValueAtTime(0, cuando);
  nodo.gain.linearRampToValueAtTime(ganancia, cuando + ataque);
  nodo.gain.setValueAtTime(ganancia, Math.max(cuando + ataque, fin - liberacion));
  nodo.gain.linearRampToValueAtTime(0, fin);
  return nodo;
}

function detener(nodos, fin) {
  for (const nodo of nodos) nodo.stop(fin);
}

// Voz guía: timbre cálido tipo "flauta de madera" con vibrato suave, el que canta la melodía.
export function vozGuia(contexto, midi, duracion, { cuando = contexto.currentTime, ganancia = 0.2 } = {}) {
  const frecuencia = midiAFrecuencia(midi);
  const fundamental = contexto.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = frecuencia;
  const segundo = contexto.createOscillator();
  segundo.type = 'triangle';
  segundo.frequency.value = frecuencia * 2;
  const gananciaSegundo = contexto.createGain();
  gananciaSegundo.gain.value = 0.18;
  const vibrato = contexto.createOscillator();
  vibrato.frequency.value = VIBRATO_HZ;
  const profundidad = contexto.createGain();
  profundidad.gain.value = (frecuencia * (2 ** (VIBRATO_CENTS / CENTS_POR_OCTAVA) - 1));
  vibrato.connect(profundidad).connect(fundamental.frequency);
  const env = envolvente(contexto, ganancia, cuando, duracion);
  fundamental.connect(env);
  segundo.connect(gananciaSegundo).connect(env);
  env.connect(contexto.destination);
  const fin = cuando + duracion + MARGEN_PARADA;
  fundamental.start(cuando);
  segundo.start(cuando);
  vibrato.start(cuando);
  detener([fundamental, segundo, vibrato], fin);
  return { nodos: [fundamental, segundo, vibrato], salida: env };
}

// Pad de acorde: tres sierras ligeramente desafinadas por nota, filtradas, muy suaves.
export function padAcorde(contexto, midis, duracion, { cuando = contexto.currentTime, ganancia = 0.05 } = {}) {
  const filtro = contexto.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 1200;
  const env = envolvente(contexto, ganancia, cuando, duracion, { ataque: 0.08, liberacion: 0.25 });
  filtro.connect(env).connect(contexto.destination);
  const nodos = [];
  for (const midi of midis) {
    for (const desafinacion of [-5, 0, 5]) {
      const osc = contexto.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = midiAFrecuencia(midi) * 2 ** (desafinacion / CENTS_POR_OCTAVA);
      osc.connect(filtro);
      osc.start(cuando);
      nodos.push(osc);
    }
  }
  detener(nodos, cuando + duracion + MARGEN_PARADA);
  return { nodos, salida: env };
}

// Bajo: triángulo con un poco de pegada al inicio.
export function bajo(contexto, midi, duracion, { cuando = contexto.currentTime, ganancia = 0.16 } = {}) {
  const osc = contexto.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = midiAFrecuencia(midi);
  const env = envolvente(contexto, ganancia, cuando, duracion, { ataque: 0.01, liberacion: 0.1 });
  osc.connect(env).connect(contexto.destination);
  osc.start(cuando);
  osc.stop(cuando + duracion + MARGEN_PARADA);
  return { nodos: [osc], salida: env };
}

// Percusión sintética: bombo (seno con caída de tono), caja (ruido corto) y charles (ruido agudo brevísimo).
export function percusion(contexto, tipo, { cuando = contexto.currentTime, ganancia = 0.12 } = {}) {
  if (tipo === 'bombo') {
    const osc = contexto.createOscillator();
    osc.frequency.setValueAtTime(140, cuando);
    osc.frequency.exponentialRampToValueAtTime(45, cuando + 0.12);
    const env = contexto.createGain();
    env.gain.setValueAtTime(ganancia * 1.6, cuando);
    env.gain.exponentialRampToValueAtTime(0.001, cuando + 0.25);
    osc.connect(env).connect(contexto.destination);
    osc.start(cuando);
    osc.stop(cuando + 0.3);
    return { nodos: [osc], salida: env };
  }
  const fuente = contexto.createBufferSource();
  fuente.buffer = obtenerRuido(contexto);
  const filtro = contexto.createBiquadFilter();
  const esCharles = tipo === 'charles';
  filtro.type = esCharles ? 'highpass' : 'bandpass';
  filtro.frequency.value = esCharles ? 7000 : 1800;
  const env = contexto.createGain();
  const duracion = esCharles ? 0.04 : 0.12;
  env.gain.setValueAtTime(esCharles ? ganancia * 0.5 : ganancia, cuando);
  env.gain.exponentialRampToValueAtTime(0.001, cuando + duracion);
  fuente.connect(filtro).connect(env).connect(contexto.destination);
  fuente.start(cuando);
  fuente.stop(cuando + duracion + MARGEN_PARADA);
  return { nodos: [fuente], salida: env };
}
