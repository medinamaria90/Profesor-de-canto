// Puntuación por notas cantadas, independiente del tiempo: se detectan las notas que ha cantado la persona
// (altura y orden) y se emparejan con las de la melodía mediante alineación dinámica (DTW). Así un retraso
// de auriculares o un ritmo distinto no convierten una melodía bien afinada en una "desafinada".
// Lógica pura.

import { CENTS_POR_SEMITONO } from '../musica/notas.js';
import { creditoMuestra, PUNTUACION_MAXIMA } from './puntuacion.js';

// Dos lecturas seguidas pertenecen a la misma nota cantada si están a menos de esta distancia.
export const UMBRAL_MISMA_NOTA_SEMITONOS = 0.6;
// Una nota cantada más corta que esto se considera un deslizamiento y se ignora.
export const DURACION_MINIMA_NOTA_SEGUNDOS = 0.12;
const HUECO_MAXIMO_SEGUNDOS = 0.25;
// Costes de la alineación (en semitonos equivalentes).
const COSTE_MAXIMO_DESVIO = 3;
const COSTE_SALTAR_CANTADA = 0.6;
const COSTE_SALTAR_OBJETIVO = 2.5;
// Dos notas seguidas iguales («Cum-ple») suelen cantarse ligadas, como una sola: una nota cantada puede
// cubrir varias notas objetivo consecutivas por un pequeño coste extra.
const COSTE_CUBRIR_OTRA_OBJETIVO = 0.3;

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[mitad] : (ordenados[mitad - 1] + ordenados[mitad]) / 2;
}

// Agrupa lecturas [{ tiempo, midi }] en notas cantadas [{ midi, inicio, fin }].
export function detectarNotasCantadas(muestras) {
  const notas = [];
  let grupo = [];
  const cerrar = () => {
    if (grupo.length === 0) return;
    const inicio = grupo[0].tiempo;
    const fin = grupo[grupo.length - 1].tiempo;
    if (fin - inicio >= DURACION_MINIMA_NOTA_SEGUNDOS) notas.push({ midi: mediana(grupo.map((m) => m.midi)), inicio, fin });
    grupo = [];
  };
  for (const muestra of muestras) {
    if (grupo.length === 0) {
      grupo.push(muestra);
      continue;
    }
    const referencia = mediana(grupo.map((m) => m.midi));
    const anterior = grupo[grupo.length - 1];
    if (Math.abs(muestra.midi - referencia) <= UMBRAL_MISMA_NOTA_SEMITONOS && muestra.tiempo - anterior.tiempo <= HUECO_MAXIMO_SEGUNDOS) {
      grupo.push(muestra);
    } else {
      cerrar();
      grupo.push(muestra);
    }
  }
  cerrar();
  return notas;
}

function costeEmparejar(cantada, objetivo) {
  return Math.min(COSTE_MAXIMO_DESVIO, Math.abs(cantada.midi - objetivo.midi));
}

// Alinea notas cantadas con notas objetivo (ambas en orden temporal). Devuelve, por nota objetivo,
// la nota cantada emparejada (la más cercana en altura si se emparejan varias) o null.
export function alinearNotas(cantadas, objetivos) {
  const n = cantadas.length;
  const m = objetivos.length;
  const coste = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity));
  const origen = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  coste[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue;
      const opciones = [];
      if (i > 0 && j > 0) opciones.push({ valor: coste[i - 1][j - 1] + costeEmparejar(cantadas[i - 1], objetivos[j - 1]), desde: [i - 1, j - 1], tipo: 'par' });
      if (i > 0 && j > 0) opciones.push({ valor: coste[i - 1][j] + costeEmparejar(cantadas[i - 1], objetivos[j - 1]), desde: [i - 1, j], tipo: 'par' });
      if (i > 0 && j > 0) opciones.push({ valor: coste[i][j - 1] + costeEmparejar(cantadas[i - 1], objetivos[j - 1]) + COSTE_CUBRIR_OTRA_OBJETIVO, desde: [i, j - 1], tipo: 'par' });
      if (i > 0) opciones.push({ valor: coste[i - 1][j] + COSTE_SALTAR_CANTADA, desde: [i - 1, j], tipo: 'saltar-cantada' });
      if (j > 0) opciones.push({ valor: coste[i][j - 1] + COSTE_SALTAR_OBJETIVO, desde: [i, j - 1], tipo: 'saltar-objetivo' });
      let mejor = opciones[0];
      for (const opcion of opciones) if (opcion.valor < mejor.valor) mejor = opcion;
      coste[i][j] = mejor.valor;
      origen[i][j] = mejor;
    }
  }
  const emparejadas = objetivos.map(() => null);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const paso = origen[i][j];
    if (!paso) break;
    if (paso.tipo === 'par') {
      const cantada = cantadas[i - 1];
      const objetivo = objetivos[j - 1];
      const actual = emparejadas[j - 1];
      if (actual === null || Math.abs(cantada.midi - objetivo.midi) < Math.abs(actual.midi - objetivo.midi)) emparejadas[j - 1] = cantada;
    }
    [i, j] = paso.desde;
  }
  return emparejadas;
}

// Puntúa una melodía por notas: devuelve { puntuacion, porNota: [{ puntuacion, cents }], errorMedio, afinadas }.
export function puntuarPorNotas(muestras, segmentos) {
  const objetivos = segmentos.filter((segmento) => segmento.midi !== null && segmento.midi !== undefined);
  const cantadas = detectarNotasCantadas(muestras);
  const emparejadas = alinearNotas(cantadas, objetivos);
  const porNota = objetivos.map((objetivo, indice) => {
    const cantada = emparejadas[indice];
    if (!cantada) return { indice: objetivo.indice, puntuacion: 0, cents: null };
    const cents = (cantada.midi - objetivo.midi) * CENTS_POR_SEMITONO;
    return { indice: objetivo.indice, puntuacion: Math.round(creditoMuestra(cents) * PUNTUACION_MAXIMA), cents };
  });
  const conCents = porNota.filter((nota) => nota.cents !== null);
  const errorMedio = conCents.length ? Math.round(conCents.reduce((suma, nota) => suma + nota.cents, 0) / conCents.length) : null;
  const puntuacion = porNota.length ? Math.round(porNota.reduce((suma, nota) => suma + nota.puntuacion, 0) / porNota.length) : 0;
  return { puntuacion, porNota, errorMedio, afinadas: porNota.filter((nota) => nota.puntuacion >= 70).length, notasCantadas: cantadas.length };
}
