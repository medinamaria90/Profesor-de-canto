// Reglas de puntuación de los ejercicios. Lógica pura, sin pantalla ni audio.

import { CENTS_POR_SEMITONO } from '../musica/notas.js';

export const TOLERANCIA_CENTS_AFINADO = 50;
export const TOLERANCIA_CENTS_AMPLIA = 100;
export const PUNTUACION_MAXIMA = 100;

export const UMBRAL_TRES_ESTRELLAS = 90;
export const UMBRAL_DOS_ESTRELLAS = 70;
export const UMBRAL_UNA_ESTRELLA = 45;

export const SEMITONOS_SIRENA_OBJETIVO = 7;

// Crédito de una muestra: 1 si está afinada, decreciente hasta 0 al salir de la tolerancia amplia.
export function creditoMuestra(cents) {
  const desvio = Math.abs(cents);
  if (desvio <= TOLERANCIA_CENTS_AFINADO) return 1;
  if (desvio >= TOLERANCIA_CENTS_AMPLIA) return 0;
  return (TOLERANCIA_CENTS_AMPLIA - desvio) / (TOLERANCIA_CENTS_AMPLIA - TOLERANCIA_CENTS_AFINADO);
}

// Fracción de muestras que se tiene en cuenta cuando se puntúa con tolerancia a las transiciones.
export const FRACCION_MEJORES_MUESTRAS = 0.75;

// Descarta las muestras más desviadas (ataques, cambios de nota) y puntúa con el resto.
export function puntuarMuestrasTolerante(centsMuestras, fraccion = FRACCION_MEJORES_MUESTRAS) {
  if (!centsMuestras.length) return puntuarMuestras(centsMuestras);
  const ordenadas = [...centsMuestras].sort((a, b) => Math.abs(a) - Math.abs(b));
  const cuantas = Math.max(1, Math.round(ordenadas.length * fraccion));
  return puntuarMuestras(ordenadas.slice(0, cuantas));
}

export function puntuarMuestras(centsMuestras) {
  if (!centsMuestras.length) {
    return { puntuacion: 0, porcentajeAfinado: 0, errorMedio: null };
  }
  let credito = 0;
  let afinadas = 0;
  let errorAcumulado = 0;
  for (const cents of centsMuestras) {
    credito += creditoMuestra(cents);
    if (Math.abs(cents) <= TOLERANCIA_CENTS_AFINADO) afinadas++;
    errorAcumulado += cents;
  }
  const total = centsMuestras.length;
  return {
    puntuacion: Math.round((credito / total) * PUNTUACION_MAXIMA),
    porcentajeAfinado: Math.round((afinadas / total) * 100),
    errorMedio: Math.round(errorAcumulado / total),
  };
}

// Una sirena se puntúa por la amplitud recorrida (en semitonos) y debe ir de grave a agudo:
// si el tramo final no está claramente por encima del inicial, la puntuación se reduce a la mitad.
export const FACTOR_PENALIZACION_SIRENA_DESCENDENTE = 0.5;
const FRACCION_TRAMO_SIRENA = 1 / 3;
const FRACCION_SUBIDA_MINIMA = 0.5;

function media(valores) {
  return valores.reduce((acumulado, valor) => acumulado + valor, 0) / valores.length;
}

export function puntuarSirena(midiMuestras, semitonosObjetivo = SEMITONOS_SIRENA_OBJETIVO) {
  if (midiMuestras.length < 2) return { puntuacion: 0, amplitud: 0, ascendente: false };
  const minimo = Math.min(...midiMuestras);
  const maximo = Math.max(...midiMuestras);
  const amplitud = maximo - minimo;
  const tramo = Math.max(1, Math.floor(midiMuestras.length * FRACCION_TRAMO_SIRENA));
  const subida = media(midiMuestras.slice(-tramo)) - media(midiMuestras.slice(0, tramo));
  const ascendente = subida >= amplitud * FRACCION_SUBIDA_MINIMA;
  const base = Math.min(1, amplitud / semitonosObjetivo) * PUNTUACION_MAXIMA;
  const puntuacion = Math.round(ascendente ? base : base * FACTOR_PENALIZACION_SIRENA_DESCENDENTE);
  return { puntuacion, amplitud, ascendente };
}

export const DESFASE_MAXIMO_SEGUNDOS = 0.9;
export const PASO_DESFASE_SEGUNDOS = 0.02;

function segmentoEn(segmentos, tiempo) {
  return segmentos.find((segmento) => tiempo >= segmento.inicio && tiempo < segmento.fin) ?? null;
}

// Busca el retraso (en segundos) con el que la voz encaja mejor con la melodía: absorbe la latencia
// de auriculares Bluetooth, del altavoz y del tiempo de reacción.
export function estimarDesfase(muestras, segmentos, { desfaseMaximo = DESFASE_MAXIMO_SEGUNDOS, paso = PASO_DESFASE_SEGUNDOS } = {}) {
  let mejoresDesfases = [0];
  let mejorCredito = -1;
  for (let desfase = 0; desfase <= desfaseMaximo + 1e-9; desfase += paso) {
    let credito = 0;
    for (const muestra of muestras) {
      const segmento = segmentoEn(segmentos, muestra.tiempo - desfase);
      if (!segmento || segmento.midi === null) continue;
      credito += creditoMuestra((muestra.midi - segmento.midi) * CENTS_POR_SEMITONO);
    }
    if (credito > mejorCredito + 1e-9) {
      mejorCredito = credito;
      mejoresDesfases = [desfase];
    } else if (Math.abs(credito - mejorCredito) <= 1e-9) {
      mejoresDesfases.push(desfase);
    }
  }
  if (mejorCredito <= 0) return 0;
  // Varios desfases pueden encajar igual de bien (las muestras son discretas): se toma el centro del tramo.
  const centro = mejoresDesfases.reduce((acumulado, valor) => acumulado + valor, 0) / mejoresDesfases.length;
  return Math.round(centro * 1000) / 1000;
}

export function puntuarMelodia(puntuacionesNotas) {
  if (!puntuacionesNotas.length) return 0;
  const suma = puntuacionesNotas.reduce((acumulado, valor) => acumulado + valor, 0);
  return Math.round(suma / puntuacionesNotas.length);
}

export function calcularEstrellas(puntuacion) {
  if (puntuacion >= UMBRAL_TRES_ESTRELLAS) return 3;
  if (puntuacion >= UMBRAL_DOS_ESTRELLAS) return 2;
  if (puntuacion >= UMBRAL_UNA_ESTRELLA) return 1;
  return 0;
}

export function calificarResultado(puntuacion) {
  if (puntuacion >= UMBRAL_TRES_ESTRELLAS) return 'excelente';
  if (puntuacion >= UMBRAL_DOS_ESTRELLAS) return 'bien';
  if (puntuacion >= UMBRAL_UNA_ESTRELLA) return 'regular';
  return 'flojo';
}
