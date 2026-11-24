// Entrada de voz simulada para probar la app sin micrófono (?simulacion=1).
// Imita a un cantante que repite la última nota guía con un ligero vibrato; si no ha sonado nada, hace una sirena lenta.

import { TAMANO_BLOQUE } from './microfono.js';
import { obtenerUltimaFrecuencia } from './sintetizador.js';

const FRECUENCIA_SIRENA_MINIMA = 150;
const FRECUENCIA_SIRENA_MAXIMA = 420;
const PERIODO_SIRENA_SEGUNDOS = 6;
const VIBRATO_HZ = 5;
const VIBRATO_CENTS = 12;
const DESAFINACION_CENTS = 10;
const GANANCIA_SIMULADA = 0.4;
const CENTS_POR_OCTAVA = 1200;

export function crearEntradaSimulada(contexto) {
  const oscilador = contexto.createOscillator();
  oscilador.type = 'sawtooth';
  const ganancia = contexto.createGain();
  ganancia.gain.value = GANANCIA_SIMULADA;
  const analizador = contexto.createAnalyser();
  analizador.fftSize = TAMANO_BLOQUE;
  oscilador.connect(ganancia).connect(analizador);
  oscilador.start();

  const buffer = new Float32Array(TAMANO_BLOQUE);
  const desafinacion = (Math.random() * 2 - 1) * DESAFINACION_CENTS;

  function frecuenciaObjetivo() {
    const guia = obtenerUltimaFrecuencia();
    const t = contexto.currentTime;
    if (guia === null) {
      const fase = (Math.sin((2 * Math.PI * t) / PERIODO_SIRENA_SEGUNDOS) + 1) / 2;
      return FRECUENCIA_SIRENA_MINIMA * (FRECUENCIA_SIRENA_MAXIMA / FRECUENCIA_SIRENA_MINIMA) ** fase;
    }
    const vibrato = Math.sin(2 * Math.PI * VIBRATO_HZ * t) * VIBRATO_CENTS;
    return guia * 2 ** ((desafinacion + vibrato) / CENTS_POR_OCTAVA);
  }

  return {
    simulada: true,
    frecuenciaMuestreo: contexto.sampleRate,
    leer() {
      oscilador.frequency.setTargetAtTime(frecuenciaObjetivo(), contexto.currentTime, 0.02);
      analizador.getFloatTimeDomainData(buffer);
      return buffer;
    },
    cerrar() {
      oscilador.stop();
      oscilador.disconnect();
    },
  };
}
