// Instrumentos sintetizados: voz guía, piano eléctrico, cuerdas, bajo y percusión. Cada función programa
// un sonido en el contexto y devuelve sus nodos para poder pararlo. Todo sale por la mesa (compresor y reverb).

import { midiAFrecuencia } from '../musica/notas.js';
import { conectarAMesa } from './mezcla.js';

const ATAQUE = 0.03;
const LIBERACION = 0.15;
const MARGEN_PARADA = 0.05;
const RUIDO_SEGUNDOS = 1;
const VIBRATO_HZ = 5.5;
const VIBRATO_CENTS = 6;
const CENTS_POR_OCTAVA = 1200;
const CASI_SILENCIO = 0.0001;

// Piano eléctrico: síntesis FM (dos senos) con el brillo que se apaga enseguida, como una lámina golpeada.
const PIANO_INDICE_INICIAL = 2.2;
const PIANO_INDICE_FINAL = 0.12;
const PIANO_SEGUNDOS_BRILLO = 0.22;
const PIANO_ATAQUE = 0.004;
const PIANO_CAIDA = 0.55; // constante de tiempo de la caída hacia el sostenido
const PIANO_SOSTENIDO = 0.22;
const PIANO_LIBERACION = 0.04;
const PIANO_DESAFINACION_CENTS = 4;
const PIANO_FILTRO_HZ = 3600;
const PIANO_ENVIO_REVERB = 0.28;

const CUERDAS_ATAQUE = 0.35;
const CUERDAS_LIBERACION = 0.45;
const CUERDAS_DESAFINACION_CENTS = 7;
const CUERDAS_FILTRO_HZ = 1100;
const CUERDAS_ENVIO_REVERB = 0.55;

const BAJO_FILTRO_HZ = 520;
const BAJO_CAIDA = 0.45;
const BAJO_SOSTENIDO = 0.55;
const BAJO_ENVIO_REVERB = 0.06;

const GUIA_ENVIO_REVERB = 0.22;
const PERCUSION_ENVIO_REVERB = 0.18;

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

// Envolvente percusiva: sube de golpe, cae hacia un sostenido y se apaga al final de la nota.
function envolventePercusiva(contexto, ganancia, cuando, duracion, { ataque, caida, sostenido, liberacion }) {
  const nodo = contexto.createGain();
  const fin = cuando + duracion;
  nodo.gain.setValueAtTime(0, cuando);
  nodo.gain.linearRampToValueAtTime(ganancia, cuando + ataque);
  nodo.gain.setTargetAtTime(ganancia * sostenido, cuando + ataque, caida);
  nodo.gain.setTargetAtTime(0, Math.max(cuando + ataque, fin - liberacion), liberacion / 3);
  return nodo;
}

function detener(nodos, fin) {
  for (const nodo of nodos) nodo.stop(fin);
}

function desafinar(frecuencia, cents) {
  return frecuencia * 2 ** (cents / CENTS_POR_OCTAVA);
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
  profundidad.gain.value = frecuencia * (2 ** (VIBRATO_CENTS / CENTS_POR_OCTAVA) - 1);
  vibrato.connect(profundidad).connect(fundamental.frequency);
  const env = envolvente(contexto, ganancia, cuando, duracion);
  fundamental.connect(env);
  segundo.connect(gananciaSegundo).connect(env);
  conectarAMesa(contexto, env, GUIA_ENVIO_REVERB);
  const fin = cuando + duracion + MARGEN_PARADA;
  fundamental.start(cuando);
  segundo.start(cuando);
  vibrato.start(cuando);
  detener([fundamental, segundo, vibrato], fin);
  return { nodos: [fundamental, segundo, vibrato], salida: env };
}

function notaDePiano(contexto, midi, duracion, cuando, destino) {
  const frecuencia = midiAFrecuencia(midi);
  const moduladora = contexto.createOscillator();
  moduladora.type = 'sine';
  moduladora.frequency.value = frecuencia;
  const indice = contexto.createGain();
  indice.gain.setValueAtTime(frecuencia * PIANO_INDICE_INICIAL, cuando);
  indice.gain.exponentialRampToValueAtTime(frecuencia * PIANO_INDICE_FINAL, cuando + PIANO_SEGUNDOS_BRILLO);
  moduladora.connect(indice);
  const portadoras = [0, PIANO_DESAFINACION_CENTS].map((cents) => {
    const portadora = contexto.createOscillator();
    portadora.type = 'sine';
    portadora.frequency.value = desafinar(frecuencia, cents);
    indice.connect(portadora.frequency);
    portadora.connect(destino);
    return portadora;
  });
  const nodos = [moduladora, ...portadoras];
  for (const nodo of nodos) nodo.start(cuando);
  detener(nodos, cuando + duracion + PIANO_LIBERACION * 4 + MARGEN_PARADA);
  return nodos;
}

// Piano eléctrico: toca un acorde (o una sola nota) con caída natural.
export function piano(contexto, midis, duracion, { cuando = contexto.currentTime, ganancia = 0.16 } = {}) {
  const filtro = contexto.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = PIANO_FILTRO_HZ;
  const env = envolventePercusiva(contexto, ganancia / Math.sqrt(midis.length), cuando, duracion, {
    ataque: PIANO_ATAQUE,
    caida: PIANO_CAIDA,
    sostenido: PIANO_SOSTENIDO,
    liberacion: PIANO_LIBERACION,
  });
  filtro.connect(env);
  conectarAMesa(contexto, env, PIANO_ENVIO_REVERB);
  const nodos = midis.flatMap((midi) => notaDePiano(contexto, midi, duracion, cuando, filtro));
  return { nodos, salida: env };
}

// Cuerdas: colchón suave que entra despacio, dos voces desafinadas por nota y muy filtradas.
export function cuerdas(contexto, midis, duracion, { cuando = contexto.currentTime, ganancia = 0.04 } = {}) {
  const filtro = contexto.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = CUERDAS_FILTRO_HZ;
  filtro.Q.value = 0.6;
  const env = envolvente(contexto, ganancia / Math.sqrt(midis.length), cuando, duracion, { ataque: CUERDAS_ATAQUE, liberacion: CUERDAS_LIBERACION });
  filtro.connect(env);
  conectarAMesa(contexto, env, CUERDAS_ENVIO_REVERB);
  const nodos = [];
  for (const midi of midis) {
    for (const cents of [-CUERDAS_DESAFINACION_CENTS, CUERDAS_DESAFINACION_CENTS]) {
      const osc = contexto.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = desafinar(midiAFrecuencia(midi), cents);
      osc.connect(filtro);
      osc.start(cuando);
      nodos.push(osc);
    }
  }
  detener(nodos, cuando + duracion + MARGEN_PARADA);
  return { nodos, salida: env };
}

// Bajo: seno redondo con un poco de triángulo para que se oiga en altavoces pequeños, y pulsación de dedo.
export function bajo(contexto, midi, duracion, { cuando = contexto.currentTime, ganancia = 0.2 } = {}) {
  const frecuencia = midiAFrecuencia(midi);
  const fundamental = contexto.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = frecuencia;
  const cuerpo = contexto.createOscillator();
  cuerpo.type = 'triangle';
  cuerpo.frequency.value = frecuencia;
  const gananciaCuerpo = contexto.createGain();
  gananciaCuerpo.gain.value = 0.5;
  const filtro = contexto.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = BAJO_FILTRO_HZ;
  const env = envolventePercusiva(contexto, ganancia, cuando, duracion, { ataque: 0.012, caida: BAJO_CAIDA, sostenido: BAJO_SOSTENIDO, liberacion: 0.08 });
  fundamental.connect(filtro);
  cuerpo.connect(gananciaCuerpo).connect(filtro);
  filtro.connect(env);
  conectarAMesa(contexto, env, BAJO_ENVIO_REVERB);
  fundamental.start(cuando);
  cuerpo.start(cuando);
  detener([fundamental, cuerpo], cuando + duracion + MARGEN_PARADA);
  return { nodos: [fundamental, cuerpo], salida: env };
}

// Percusión discreta: bombo redondo, caja como escobilla y charles brevísimo.
export function percusion(contexto, tipo, { cuando = contexto.currentTime, ganancia = 0.08 } = {}) {
  if (tipo === 'bombo') {
    const osc = contexto.createOscillator();
    osc.frequency.setValueAtTime(120, cuando);
    osc.frequency.exponentialRampToValueAtTime(42, cuando + 0.14);
    const env = contexto.createGain();
    env.gain.setValueAtTime(ganancia * 1.4, cuando);
    env.gain.exponentialRampToValueAtTime(CASI_SILENCIO, cuando + 0.28);
    osc.connect(env);
    conectarAMesa(contexto, env);
    osc.start(cuando);
    osc.stop(cuando + 0.3);
    return { nodos: [osc], salida: env };
  }
  const fuente = contexto.createBufferSource();
  fuente.buffer = obtenerRuido(contexto);
  const filtro = contexto.createBiquadFilter();
  const esCharles = tipo === 'charles';
  filtro.type = esCharles ? 'highpass' : 'bandpass';
  filtro.frequency.value = esCharles ? 8000 : 2400;
  filtro.Q.value = esCharles ? 0.7 : 0.9;
  const env = contexto.createGain();
  const duracion = esCharles ? 0.035 : 0.1;
  env.gain.setValueAtTime(esCharles ? ganancia * 0.35 : ganancia * 0.7, cuando);
  env.gain.exponentialRampToValueAtTime(CASI_SILENCIO, cuando + duracion);
  fuente.connect(filtro).connect(env);
  conectarAMesa(contexto, env, esCharles ? 0 : PERCUSION_ENVIO_REVERB);
  fuente.start(cuando);
  fuente.stop(cuando + duracion + MARGEN_PARADA);
  return { nodos: [fuente], salida: env };
}
