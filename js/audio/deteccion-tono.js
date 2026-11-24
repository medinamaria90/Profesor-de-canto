// Detección de tono fundamental con la función de diferencia cuadrada normalizada (NSDF, método McLeod).
// Lógica pura: recibe un bloque de muestras y devuelve la frecuencia o null si no hay voz clara.

export const FRECUENCIA_MINIMA = 65;
export const FRECUENCIA_MAXIMA = 1100;
export const UMBRAL_RMS = 0.01;
export const UMBRAL_CLARIDAD = 0.88;

// Entre los máximos locales, se elige el primero que supere esta fracción del mayor
// para evitar saltar una octava hacia abajo.
const FRACCION_PICO_ACEPTABLE = 0.9;
const RETARDO_MINIMO_ABSOLUTO = 2;

export function calcularRms(buffer) {
  let suma = 0;
  for (let i = 0; i < buffer.length; i++) suma += buffer[i] * buffer[i];
  return Math.sqrt(suma / buffer.length);
}

function calcularNsdf(buffer, retardoMinimo, retardoMaximo) {
  const n = buffer.length;
  const nsdf = new Float32Array(retardoMaximo + 1);
  for (let retardo = retardoMinimo; retardo <= retardoMaximo; retardo++) {
    let autocorrelacion = 0;
    let energia = 0;
    for (let i = 0; i + retardo < n; i++) {
      const a = buffer[i];
      const b = buffer[i + retardo];
      autocorrelacion += a * b;
      energia += a * a + b * b;
    }
    nsdf[retardo] = energia > 0 ? (2 * autocorrelacion) / energia : 0;
  }
  return nsdf;
}

// Devuelve el máximo local de cada tramo positivo de la NSDF, saltando el primero (retardo cero).
function buscarMaximosClave(nsdf, retardoMinimo, retardoMaximo) {
  const maximos = [];
  let retardo = retardoMinimo;
  while (retardo <= retardoMaximo && nsdf[retardo] > 0) retardo++;
  while (retardo <= retardoMaximo) {
    while (retardo <= retardoMaximo && nsdf[retardo] <= 0) retardo++;
    let mejorRetardo = -1;
    let mejorValor = -Infinity;
    while (retardo <= retardoMaximo && nsdf[retardo] > 0) {
      if (nsdf[retardo] > mejorValor) {
        mejorValor = nsdf[retardo];
        mejorRetardo = retardo;
      }
      retardo++;
    }
    if (mejorRetardo > 0) maximos.push({ retardo: mejorRetardo, valor: mejorValor });
  }
  return maximos;
}

function interpolarParabola(nsdf, retardo, retardoMaximo) {
  if (retardo <= 0 || retardo >= retardoMaximo) return retardo;
  const anterior = nsdf[retardo - 1];
  const actual = nsdf[retardo];
  const siguiente = nsdf[retardo + 1];
  const denominador = anterior - 2 * actual + siguiente;
  if (denominador === 0) return retardo;
  return retardo + (0.5 * (anterior - siguiente)) / denominador;
}

export function detectarTono(buffer, frecuenciaMuestreo) {
  const rms = calcularRms(buffer);
  if (rms < UMBRAL_RMS) return null;

  const retardoMinimo = Math.max(RETARDO_MINIMO_ABSOLUTO, Math.floor(frecuenciaMuestreo / FRECUENCIA_MAXIMA));
  const retardoMaximo = Math.min(buffer.length >> 1, Math.floor(frecuenciaMuestreo / FRECUENCIA_MINIMA));
  if (retardoMaximo <= retardoMinimo) return null;

  const nsdf = calcularNsdf(buffer, retardoMinimo, retardoMaximo);
  const maximos = buscarMaximosClave(nsdf, retardoMinimo, retardoMaximo);
  if (maximos.length === 0) return null;

  const mayorValor = Math.max(...maximos.map((m) => m.valor));
  const elegido = maximos.find((m) => m.valor >= FRACCION_PICO_ACEPTABLE * mayorValor);
  if (!elegido || elegido.valor < UMBRAL_CLARIDAD) return null;

  const retardoRefinado = interpolarParabola(nsdf, elegido.retardo, retardoMaximo);
  return { frecuencia: frecuenciaMuestreo / retardoRefinado, claridad: elegido.valor, rms };
}
