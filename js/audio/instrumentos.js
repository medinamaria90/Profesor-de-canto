// Instrumentos: voz guía (sintetizada) y piano. El piano usa las muestras grabadas si están cargadas y, si no,
// un piano eléctrico sintetizado (FM). Cada función programa un sonido y devuelve sus nodos para poder pararlo.
// Todo sale por la mesa (compresor y reverberación).

import { midiAFrecuencia } from '../musica/notas.js';
import { conectarAMesa } from './mezcla.js';
import { pianoListo, notaPianoGrabado } from './piano-muestras.js';

const ATAQUE = 0.03;
const LIBERACION = 0.15;
const MARGEN_PARADA = 0.05;
const VIBRATO_HZ = 5.5;
const VIBRATO_CENTS = 6;
const CENTS_POR_OCTAVA = 1200;

// Piano eléctrico de respaldo: síntesis FM (dos senos) con el brillo que se apaga enseguida.
const FM_INDICE_INICIAL = 2.2;
const FM_INDICE_FINAL = 0.12;
const FM_SEGUNDOS_BRILLO = 0.22;
const FM_ATAQUE = 0.004;
const FM_CAIDA = 0.55; // constante de tiempo de la caída hacia el sostenido
const FM_SOSTENIDO = 0.22;
const FM_LIBERACION = 0.04;
const FM_DESAFINACION_CENTS = 4;
const FM_FILTRO_HZ = 3600;

const PIANO_ENVIO_REVERB = 0.26;
const GUIA_ENVIO_REVERB = 0.22;

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

function notaPianoSintetizado(contexto, midi, duracion, cuando, destino) {
  const frecuencia = midiAFrecuencia(midi);
  const moduladora = contexto.createOscillator();
  moduladora.type = 'sine';
  moduladora.frequency.value = frecuencia;
  const indice = contexto.createGain();
  indice.gain.setValueAtTime(frecuencia * FM_INDICE_INICIAL, cuando);
  indice.gain.exponentialRampToValueAtTime(frecuencia * FM_INDICE_FINAL, cuando + FM_SEGUNDOS_BRILLO);
  moduladora.connect(indice);
  const filtro = contexto.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = FM_FILTRO_HZ;
  const env = envolventePercusiva(contexto, 1, cuando, duracion, { ataque: FM_ATAQUE, caida: FM_CAIDA, sostenido: FM_SOSTENIDO, liberacion: FM_LIBERACION });
  filtro.connect(env).connect(destino);
  const portadoras = [0, FM_DESAFINACION_CENTS].map((cents) => {
    const portadora = contexto.createOscillator();
    portadora.type = 'sine';
    portadora.frequency.value = desafinar(frecuencia, cents);
    indice.connect(portadora.frequency);
    portadora.connect(filtro);
    return portadora;
  });
  const nodos = [moduladora, ...portadoras];
  for (const nodo of nodos) nodo.start(cuando);
  detener(nodos, cuando + duracion + FM_LIBERACION * 4 + MARGEN_PARADA);
  return nodos;
}

// Piano: toca un acorde (o una sola nota). La ganancia se reparte entre las notas para que un acorde no suene más que una nota.
export function piano(contexto, midis, duracion, { cuando = contexto.currentTime, ganancia = 0.2 } = {}) {
  const salida = contexto.createGain();
  salida.gain.value = ganancia / Math.sqrt(midis.length);
  conectarAMesa(contexto, salida, PIANO_ENVIO_REVERB);
  const grabado = pianoListo();
  const nodos = midis.flatMap((midi) => (grabado ? [notaPianoGrabado(contexto, midi, duracion, cuando, salida)] : notaPianoSintetizado(contexto, midi, duracion, cuando, salida)));
  return { nodos, salida };
}
