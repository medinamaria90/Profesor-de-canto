// Reglas de puntuación de los ejercicios. Lógica pura, sin pantalla ni audio.

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
