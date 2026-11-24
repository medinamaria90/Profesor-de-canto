// Reglas de progreso: XP, racha diaria, lecciones y rutina. Funciones puras que devuelven un estado nuevo.

export const VERSION_ESTADO = 1;
export const OBJETIVOS_DIARIOS = [
  { id: 'tranquilo', xp: 30, minutos: 5 },
  { id: 'constante', xp: 50, minutos: 10 },
  { id: 'intenso', xp: 100, minutos: 20 },
];
export const OBJETIVO_DIARIO_POR_DEFECTO = OBJETIVOS_DIARIOS[1].xp;

// Do3 a Sol4: una zona cómoda para la mayoría de voces sin medir.
export const RANGO_VOCAL_POR_DEFECTO = { minimo: 48, maximo: 67 };
export const AMPLITUD_MINIMA_RANGO = 7;

export const XP_POR_PUNTO = 0.1;
export const BONUS_XP_LECCION_PERFECTA = 15;
export const UMBRAL_LECCION_PERFECTA = 90;
export const XP_RUTINA_DIARIA = 30;

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export const ESTADO_INICIAL = Object.freeze({
  version: VERSION_ESTADO,
  bienvenidaCompletada: false,
  nombre: '',
  objetivoDiarioXp: OBJETIVO_DIARIO_POR_DEFECTO,
  xpTotal: 0,
  racha: 0,
  mejorRacha: 0,
  ultimoDiaActivo: null,
  xpPorDia: {},
  lecciones: {},
  rutinasDiarias: {},
  rangoVocal: null,
  historialRango: [],
  logros: {},
  juegos: {},
  oido: { nivel: 1, racha: 0, aciertos: 0, intentos: 0 },
});

export const NIVEL_OIDO_MINIMO = 1;
export const NIVEL_OIDO_MAXIMO = 4;
// Intervalo mínimo entre las dos notas, en semitonos, por nivel de oído.
export const SEMITONOS_POR_NIVEL_OIDO = { 1: 2, 2: 1, 3: 0.5, 4: 0.25 };
export const ACIERTOS_PARA_SUBIR_NIVEL = 3;
// Con el nivel máximo y esta racha, el oído ya no se pregunta: se cambia por cantar.
export const RACHA_PARA_DEJAR_DE_PREGUNTAR = 3;

export function habilidadOido(estado) {
  return estado.oido ?? ESTADO_INICIAL.oido;
}

// Escalera adaptativa: tres aciertos seguidos suben de nivel, un fallo baja uno.
export function registrarRespuestaOido(estado, acierto) {
  const actual = habilidadOido(estado);
  let nivel = actual.nivel;
  let racha = acierto ? actual.racha + 1 : 0;
  if (acierto && racha >= ACIERTOS_PARA_SUBIR_NIVEL && nivel < NIVEL_OIDO_MAXIMO) {
    nivel++;
    racha = 0;
  } else if (!acierto) {
    nivel = Math.max(NIVEL_OIDO_MINIMO, nivel - 1);
  }
  return {
    ...estado,
    oido: { nivel, racha, aciertos: actual.aciertos + (acierto ? 1 : 0), intentos: actual.intentos + 1 },
  };
}

export function oidoDominado(estado) {
  const { nivel, racha } = habilidadOido(estado);
  return nivel >= NIVEL_OIDO_MAXIMO && racha >= RACHA_PARA_DEJAR_DE_PREGUNTAR;
}

export function fechaClave(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function diasEntre(claveA, claveB) {
  const a = Date.UTC(...descomponerClave(claveA));
  const b = Date.UTC(...descomponerClave(claveB));
  return Math.round((b - a) / MILISEGUNDOS_POR_DIA);
}

function descomponerClave(clave) {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return [anio, mes - 1, dia];
}

export function rachaVigente(estado, hoy) {
  if (!estado.ultimoDiaActivo) return 0;
  const distancia = diasEntre(estado.ultimoDiaActivo, hoy);
  return distancia <= 1 ? estado.racha : 0;
}

export function registrarActividad(estado, xp, hoy) {
  let racha = 1;
  if (estado.ultimoDiaActivo) {
    const distancia = diasEntre(estado.ultimoDiaActivo, hoy);
    if (distancia === 0) racha = estado.racha;
    else if (distancia === 1) racha = estado.racha + 1;
  }
  return {
    ...estado,
    xpTotal: estado.xpTotal + xp,
    racha,
    mejorRacha: Math.max(estado.mejorRacha, racha),
    ultimoDiaActivo: hoy,
    xpPorDia: { ...estado.xpPorDia, [hoy]: (estado.xpPorDia[hoy] ?? 0) + xp },
  };
}

export function calcularXpLeccion(puntuaciones) {
  if (!puntuaciones.length) return 0;
  const suma = puntuaciones.reduce((acumulado, valor) => acumulado + valor, 0);
  const media = suma / puntuaciones.length;
  const base = Math.round(suma * XP_POR_PUNTO);
  return media >= UMBRAL_LECCION_PERFECTA ? base + BONUS_XP_LECCION_PERFECTA : base;
}

export function registrarLeccion(estado, { leccionId, puntuacion, estrellas, xp, hoy }) {
  const anterior = estado.lecciones[leccionId];
  const registro = {
    intentos: (anterior?.intentos ?? 0) + 1,
    mejorPuntuacion: Math.max(anterior?.mejorPuntuacion ?? 0, puntuacion),
    estrellas: Math.max(anterior?.estrellas ?? 0, estrellas),
    ultimaFecha: hoy,
  };
  const conActividad = registrarActividad(estado, xp, hoy);
  return { ...conActividad, lecciones: { ...estado.lecciones, [leccionId]: registro } };
}

export function registrarRutina(estado, puntuacion, hoy) {
  const conActividad = registrarActividad(estado, XP_RUTINA_DIARIA, hoy);
  return { ...conActividad, rutinasDiarias: { ...estado.rutinasDiarias, [hoy]: puntuacion } };
}

// Guarda el resultado de una partida de un minijuego: partidas jugadas y mejor marca.
export function registrarPartida(estado, { juegoId, puntuacion, xp, hoy }) {
  const anterior = estado.juegos[juegoId];
  const registro = {
    partidas: (anterior?.partidas ?? 0) + 1,
    mejorPuntuacion: Math.max(anterior?.mejorPuntuacion ?? 0, puntuacion),
    ultimaFecha: hoy,
  };
  const conActividad = registrarActividad(estado, xp, hoy);
  return { ...conActividad, juegos: { ...estado.juegos, [juegoId]: registro } };
}

export function mejorPuntuacionJuego(estado, juegoId) {
  return estado.juegos[juegoId]?.mejorPuntuacion ?? 0;
}

export function xpHoy(estado, hoy) {
  return estado.xpPorDia[hoy] ?? 0;
}

export function rutinaHechaHoy(estado, hoy) {
  return hoy in estado.rutinasDiarias;
}

export function estrellasLeccion(estado, leccionId) {
  return estado.lecciones[leccionId]?.estrellas ?? 0;
}

export function totalEstrellas(estado) {
  return Object.values(estado.lecciones).reduce((acumulado, l) => acumulado + l.estrellas, 0);
}

export function rangoVocalEfectivo(estado) {
  const rango = estado.rangoVocal;
  if (!rango || rango.maximo - rango.minimo < AMPLITUD_MINIMA_RANGO) return RANGO_VOCAL_POR_DEFECTO;
  return rango;
}

// Guarda el rango medido y lo añade al historial (una entrada por día: la última del día sustituye a la anterior).
export function guardarRangoVocal(estado, minimo, maximo, hoy) {
  const rango = { minimo: Math.round(minimo), maximo: Math.round(maximo) };
  const historial = (estado.historialRango ?? []).filter((medida) => medida.fecha !== hoy);
  return { ...estado, rangoVocal: rango, historialRango: [...historial, { fecha: hoy, ...rango }] };
}

// Semitonos ganados entre la primera medición y la última.
export function mejoraDelRango(estado) {
  const historial = estado.historialRango ?? [];
  if (historial.length < 2) return 0;
  const primera = historial[0];
  const ultima = historial[historial.length - 1];
  return ultima.maximo - ultima.minimo - (primera.maximo - primera.minimo);
}

export function completarBienvenida(estado, { nombre, objetivoDiarioXp }) {
  return { ...estado, bienvenidaCompletada: true, nombre: nombre.trim(), objetivoDiarioXp };
}

export function desbloquearLogro(estado, logroId, hoy) {
  if (estado.logros[logroId]) return estado;
  return { ...estado, logros: { ...estado.logros, [logroId]: hoy } };
}

// Acepta un estado guardado de cualquier versión anterior y lo completa con los campos actuales.
export function migrarEstado(guardado) {
  if (!guardado || typeof guardado !== 'object') return { ...ESTADO_INICIAL };
  return { ...ESTADO_INICIAL, ...guardado, version: VERSION_ESTADO };
}
