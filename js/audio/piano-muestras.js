// Piano acústico grabado: una muestra cada dos semitonos (FluidR3 GM, CC BY 3.0, ver sonidos/piano/LICENCIA.txt).
// Las notas intermedias se obtienen cambiando la velocidad de lectura, un semitono como mucho.

const RUTA = 'sonidos/piano/';
const NOMBRES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const MIDI_MINIMO_MUESTRA = 36; // Do2
export const MIDI_MAXIMO_MUESTRA = 84; // Do6
export const PASO_MUESTRAS = 2;
const SEMITONOS_POR_OCTAVA = 12;
const OCTAVA_DEL_MIDI_CERO = -1;
const LIBERACION = 0.12;
const MARGEN_PARADA = 0.05;

const buffers = new Map();
let carga = null;

export function midisMuestreados() {
  const lista = [];
  for (let midi = MIDI_MINIMO_MUESTRA; midi <= MIDI_MAXIMO_MUESTRA; midi += PASO_MUESTRAS) lista.push(midi);
  return lista;
}

export function nombreArchivoMuestra(midi) {
  return `${NOMBRES[midi % SEMITONOS_POR_OCTAVA]}${Math.floor(midi / SEMITONOS_POR_OCTAVA) + OCTAVA_DEL_MIDI_CERO}.mp3`;
}

// La muestra grabada más cercana a una nota, dentro del rango disponible.
export function muestraMasCercana(midi) {
  const acotado = Math.min(MIDI_MAXIMO_MUESTRA, Math.max(MIDI_MINIMO_MUESTRA, midi));
  return MIDI_MINIMO_MUESTRA + Math.round((acotado - MIDI_MINIMO_MUESTRA) / PASO_MUESTRAS) * PASO_MUESTRAS;
}

async function cargarMuestra(contexto, midi) {
  const respuesta = await fetch(RUTA + nombreArchivoMuestra(midi));
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${nombreArchivoMuestra(midi)} (${respuesta.status})`);
  buffers.set(midi, await contexto.decodeAudioData(await respuesta.arrayBuffer()));
}

// Descarga y decodifica todas las muestras una sola vez. Devuelve true si el piano grabado está listo.
export function cargarPiano(contexto) {
  if (pianoListo()) return Promise.resolve(true);
  carga ??= Promise.all(midisMuestreados().map((midi) => cargarMuestra(contexto, midi)))
    .then(() => true)
    .catch((error) => {
      console.warn('Piano grabado no disponible; suena el sintetizado.', error);
      carga = null;
      return false;
    });
  return carga;
}

export function pianoListo() {
  return buffers.size === midisMuestreados().length;
}

// Programa una nota del piano grabado hacia `destino` y devuelve sus nodos.
export function notaPianoGrabado(contexto, midi, duracion, cuando, destino) {
  const muestra = muestraMasCercana(midi);
  const fuente = contexto.createBufferSource();
  fuente.buffer = buffers.get(muestra);
  fuente.playbackRate.value = 2 ** ((midi - muestra) / SEMITONOS_POR_OCTAVA);
  const env = contexto.createGain();
  env.gain.setValueAtTime(1, cuando);
  env.gain.setTargetAtTime(0, cuando + duracion, LIBERACION / 3);
  fuente.connect(env).connect(destino);
  fuente.start(cuando);
  fuente.stop(cuando + duracion + LIBERACION * 4 + MARGEN_PARADA);
  return fuente;
}
