// Conversión entre frecuencias, números MIDI y nombres de nota (notación latina).

export const NOMBRES_NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const MIDI_LA4 = 69;
export const FRECUENCIA_LA4 = 440;
export const SEMITONOS_POR_OCTAVA = 12;
export const CENTS_POR_SEMITONO = 100;

// En notación científica el MIDI 0 es Do de la octava -1 (el Do central, MIDI 60, es Do4).
const OCTAVA_DEL_MIDI_CERO = -1;

export function midiAFrecuencia(midi) {
  return FRECUENCIA_LA4 * 2 ** ((midi - MIDI_LA4) / SEMITONOS_POR_OCTAVA);
}

export function frecuenciaAMidi(frecuencia) {
  return MIDI_LA4 + SEMITONOS_POR_OCTAVA * Math.log2(frecuencia / FRECUENCIA_LA4);
}

export function nombreNota(midi, conOctava = true) {
  const redondeado = Math.round(midi);
  const indice = ((redondeado % SEMITONOS_POR_OCTAVA) + SEMITONOS_POR_OCTAVA) % SEMITONOS_POR_OCTAVA;
  const nombre = NOMBRES_NOTAS[indice];
  if (!conOctava) return nombre;
  const octava = Math.floor(redondeado / SEMITONOS_POR_OCTAVA) + OCTAVA_DEL_MIDI_CERO;
  return `${nombre}${octava}`;
}

// Desviación, en cents, de una frecuencia respecto a una nota MIDI objetivo (positivo = más agudo).
export function centsEntre(frecuencia, midiObjetivo) {
  return (frecuenciaAMidi(frecuencia) - midiObjetivo) * CENTS_POR_SEMITONO;
}

export function notaMasCercana(frecuencia) {
  const midiFlotante = frecuenciaAMidi(frecuencia);
  const midi = Math.round(midiFlotante);
  return { midi, cents: (midiFlotante - midi) * CENTS_POR_SEMITONO };
}

export function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}
