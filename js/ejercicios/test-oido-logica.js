// Lógica pura del test de oído: escalera adaptativa para el oído relativo y evaluación del oído absoluto.

// Se empieza en 200 cents (dos semitonos); los dos escalones superiores solo se usan si alguien falla ahí.
// El último escalón (2 cents) está en el límite medido en laboratorio para músicos muy entrenados.
export const NIVELES_RELATIVO_CENTS = [700, 400, 200, 100, 50, 35, 25, 15, 10, 7, 5, 3, 2];
export const INDICE_INICIAL_RELATIVO = 2;
export const PREGUNTAS_RELATIVO = 24;
export const PREGUNTAS_ABSOLUTO = 10;
// Si las primeras respuestas del oído absoluto no aciertan ninguna nota exacta, el test se corta.
export const PREGUNTAS_ABSOLUTO_MINIMAS = 4;
// Referencias de estudios de discriminación de tono (Micheyl et al. 2006; Kishon-Rabin et al. 2001; Peretz y Vuvan 2017):
// músicos profesionales 2-3 cents, personas sin entrenar 9-15 cents de media, amusia (1,5-4 % de la población) un semitono o más.
export const UMBRAL_PROFESIONAL_CENTS = 3;
export const UMBRAL_MEDIA_SIN_ENTRENAR_CENTS = 12;
// Escalera "dos aciertos para subir, un fallo para bajar": converge hacia el 70 % de aciertos.
const ACIERTOS_PARA_SUBIR = 2;
const CAMBIOS_DE_SENTIDO_PARA_UMBRAL = 4;

export const SEMITONOS_POR_OCTAVA = 12;
export const PROBABILIDAD_AZAR_ABSOLUTO = 1 / SEMITONOS_POR_OCTAVA;

export function crearEscalera() {
  return { indice: INDICE_INICIAL_RELATIVO, racha: 0, historial: [], sentidoAnterior: null, cambios: [] };
}

export function intervaloActual(escalera) {
  return NIVELES_RELATIVO_CENTS[escalera.indice];
}

// Registra una respuesta y devuelve la escalera nueva.
export function responderRelativo(escalera, acierto) {
  const historial = [...escalera.historial, { cents: intervaloActual(escalera), acierto }];
  let indice = escalera.indice;
  let racha = acierto ? escalera.racha + 1 : 0;
  let sentido = null;
  if (acierto && racha >= ACIERTOS_PARA_SUBIR) {
    if (indice < NIVELES_RELATIVO_CENTS.length - 1) indice++;
    racha = 0;
    sentido = 'mas-dificil';
  } else if (!acierto) {
    if (indice > 0) indice--;
    sentido = 'mas-facil';
  }
  const cambios = [...escalera.cambios];
  if (sentido && escalera.sentidoAnterior && sentido !== escalera.sentidoAnterior) cambios.push(intervaloActual(escalera));
  return { indice, racha, historial, sentidoAnterior: sentido ?? escalera.sentidoAnterior, cambios };
}

// Umbral estimado en cents: media de los últimos cambios de sentido; si hay pocos, el nivel más fino acertado.
export function umbralRelativo(escalera) {
  const ultimos = escalera.cambios.slice(-CAMBIOS_DE_SENTIDO_PARA_UMBRAL);
  if (ultimos.length >= 2) return Math.round(ultimos.reduce((suma, valor) => suma + valor, 0) / ultimos.length);
  const acertados = escalera.historial.filter((respuesta) => respuesta.acierto).map((respuesta) => respuesta.cents);
  return acertados.length ? Math.min(...acertados) : NIVELES_RELATIVO_CENTS[0];
}

export function valorarRelativo(umbralCents) {
  if (umbralCents <= 3) return 'excepcional';
  if (umbralCents <= 5) return 'profesional';
  if (umbralCents <= 10) return 'muy-bueno';
  if (umbralCents <= 25) return 'bueno';
  if (umbralCents <= 60) return 'normal';
  if (umbralCents <= 100) return 'a-entrenar';
  return 'dificultad';
}

// Estimación de en qué parte de la población queda un umbral, a partir de los estudios citados arriba.
// Es orientativa: los estudios usan tonos puros y condiciones de laboratorio.
export function poblacionRelativo(umbralCents) {
  if (umbralCents <= 3) return { mejorQue: 99, texto: 'menos del 1 %' };
  if (umbralCents <= 5) return { mejorQue: 95, texto: 'alrededor del 5 % mejor' };
  if (umbralCents <= 10) return { mejorQue: 70, texto: 'el 30 % mejor' };
  if (umbralCents <= 25) return { mejorQue: 45, texto: 'la mitad de la población' };
  if (umbralCents <= 60) return { mejorQue: 15, texto: 'por debajo de la media' };
  if (umbralCents <= 100) return { mejorQue: 5, texto: 'el 10 % con más dificultad' };
  return { mejorQue: 1, texto: 'el 2-4 % con más dificultad' };
}

// true cuando ya no merece la pena seguir preguntando por el oído absoluto.
export function debeDetenerAbsoluto(respuestas) {
  if (respuestas.length < PREGUNTAS_ABSOLUTO_MINIMAS) return false;
  if (respuestas.length >= PREGUNTAS_ABSOLUTO) return true;
  return respuestas.every((r) => r.correcta !== r.elegida);
}

// respuestas: [{ correcta: grado 0-11, elegida: grado 0-11 }]
export function evaluarAbsoluto(respuestas) {
  const exactas = respuestas.filter((r) => r.correcta === r.elegida).length;
  const cercanas = respuestas.filter((r) => distanciaCircular(r.correcta, r.elegida) === 1).length;
  const total = respuestas.length;
  const porcentajeExacto = total ? Math.round((exactas / total) * 100) : 0;
  return { exactas, cercanas, total, porcentajeExacto, azar: Math.round(PROBABILIDAD_AZAR_ABSOLUTO * 100) };
}

function distanciaCircular(a, b) {
  const diferencia = Math.abs(a - b) % SEMITONOS_POR_OCTAVA;
  return Math.min(diferencia, SEMITONOS_POR_OCTAVA - diferencia);
}

export function valorarAbsoluto({ porcentajeExacto }) {
  if (porcentajeExacto >= 70) return 'probable';
  if (porcentajeExacto >= 35) return 'indicios';
  return 'no';
}

// Nota aleatoria para el test absoluto, evitando repetir la anterior y en un ámbito cantable.
export function notaAbsolutaAleatoria(anterior, aleatorio, { minimo = 48, maximo = 72 } = {}) {
  let midi;
  do {
    midi = minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
  } while (anterior !== null && midi % SEMITONOS_POR_OCTAVA === anterior % SEMITONOS_POR_OCTAVA);
  return midi;
}

// Par de notas para una pregunta de oído relativo: separadas `cents`, en orden aleatorio.
export function parRelativo(cents, aleatorio, { minimo = 50, maximo = 70 } = {}) {
  const semitonos = cents / 100;
  const grave = minimo + aleatorio() * (maximo - minimo - semitonos);
  const agudoPrimero = aleatorio() < 0.5;
  const notas = agudoPrimero ? [grave + semitonos, grave] : [grave, grave + semitonos];
  return { notas, respuestaCorrecta: agudoPrimero ? 'primera' : 'segunda' };
}
