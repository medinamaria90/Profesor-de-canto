// Sintetizador sencillo para reproducir notas guía, melodías y clics de metrónomo.

import { midiAFrecuencia } from '../musica/notas.js';
import { vozGuia } from './instrumentos.js';

const MARGEN_PARADA_SEGUNDOS = 0.05;
export const GANANCIA_GUIA = 0.22;
export const GANANCIA_ACOMPANAMIENTO = 0.07;
const GANANCIA_CLICK = 0.12;
const FRECUENCIA_CLICK = 1000;
const FRECUENCIA_CLICK_ACENTO = 1500;
const DURACION_CLICK_SEGUNDOS = 0.04;
const SEGUNDOS_POR_MINUTO = 60;

const vocesActivas = new Set();
let ultimaFrecuencia = null;
let temporizadoresFrecuencia = [];

// La entrada simulada "canta" la última nota que ha sonado.
export function obtenerUltimaFrecuencia() {
  return ultimaFrecuencia;
}

function anotarFrecuencia(contexto, frecuencia, cuando) {
  const retraso = Math.max(0, (cuando - contexto.currentTime) * 1000);
  const temporizador = setTimeout(() => {
    ultimaFrecuencia = frecuencia;
    temporizadoresFrecuencia = temporizadoresFrecuencia.filter((id) => id !== temporizador);
  }, retraso);
  temporizadoresFrecuencia.push(temporizador);
}

export function reproducirNota(contexto, midi, duracion, { cuando = contexto.currentTime, ganancia = GANANCIA_GUIA } = {}) {
  const { nodos, salida } = vozGuia(contexto, midi, duracion, { cuando, ganancia });
  anotarFrecuencia(contexto, midiAFrecuencia(midi), cuando);
  const voz = { nodos, salida };
  vocesActivas.add(voz);
  nodos[0].onended = () => {
    salida.disconnect();
    vocesActivas.delete(voz);
  };
  return voz;
}

export function clickMetronomo(contexto, cuando, acento = false) {
  const oscilador = contexto.createOscillator();
  oscilador.type = 'sine';
  oscilador.frequency.value = acento ? FRECUENCIA_CLICK_ACENTO : FRECUENCIA_CLICK;
  const envolvente = contexto.createGain();
  envolvente.gain.setValueAtTime(GANANCIA_CLICK, cuando);
  envolvente.gain.exponentialRampToValueAtTime(0.001, cuando + DURACION_CLICK_SEGUNDOS);
  oscilador.connect(envolvente).connect(contexto.destination);
  oscilador.start(cuando);
  oscilador.stop(cuando + DURACION_CLICK_SEGUNDOS + MARGEN_PARADA_SEGUNDOS);
}

export function segundosPorPulso(tempo) {
  return SEGUNDOS_POR_MINUTO / tempo;
}

// Programa una secuencia de notas [{ midi, pulsos }] y devuelve cuándo empieza y cuánto dura.
export function reproducirSecuencia(contexto, notas, tempo, { cuando = contexto.currentTime, ganancia = GANANCIA_GUIA } = {}) {
  const pulso = segundosPorPulso(tempo);
  let cursor = cuando;
  for (const nota of notas) {
    const duracion = nota.pulsos * pulso;
    if (nota.midi !== null) reproducirNota(contexto, nota.midi, duracion * 0.95, { cuando: cursor, ganancia });
    cursor += duracion;
  }
  return { inicio: cuando, duracion: cursor - cuando };
}

export function detenerTodo() {
  for (const voz of vocesActivas) {
    for (const nodo of voz.nodos) {
      try {
        nodo.stop();
      } catch (error) {
        // Un oscilador ya detenido lanza InvalidStateError; no hay nada más que parar.
        if (error.name !== 'InvalidStateError') throw error;
      }
    }
  }
  vocesActivas.clear();
  temporizadoresFrecuencia.forEach(clearTimeout);
  temporizadoresFrecuencia = [];
}
