// Persistencia en localStorage con copia en memoria si el almacenamiento falla (modo privado, cuota llena…).

const CLAVE_PROGRESO = 'alondra.progreso.v1';
const CLAVE_MICROFONO = 'alondra.microfono-permitido';
const CLAVE_LATENCIA = 'alondra.latencia-aprendida';
const CLAVE_ULTIMO_ERROR = 'alondra.ultimo-error';
const LONGITUD_MAXIMA_ERROR = 400;

let copiaEnMemoria = null;

export function cargarProgreso() {
  try {
    const texto = window.localStorage.getItem(CLAVE_PROGRESO);
    return texto ? JSON.parse(texto) : copiaEnMemoria;
  } catch (error) {
    console.warn('No se pudo leer el progreso guardado; se usa la copia en memoria.', error);
    return copiaEnMemoria;
  }
}

export function guardarProgreso(estado) {
  copiaEnMemoria = estado;
  try {
    window.localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(estado));
  } catch (error) {
    console.warn('No se pudo guardar el progreso; se mantiene solo en memoria.', error);
  }
}

export function leerPermisoMicrofono() {
  try {
    return window.localStorage.getItem(CLAVE_MICROFONO) === '1';
  } catch (error) {
    console.warn('No se pudo leer el permiso de micrófono recordado.', error);
    return false;
  }
}

export function guardarPermisoMicrofono() {
  try {
    window.localStorage.setItem(CLAVE_MICROFONO, '1');
  } catch (error) {
    console.warn('No se pudo recordar el permiso de micrófono.', error);
  }
}

export function leerLatenciaAprendida() {
  try {
    const valor = Number(window.localStorage.getItem(CLAVE_LATENCIA));
    return Number.isFinite(valor) ? valor : 0;
  } catch (error) {
    console.warn('No se pudo leer la latencia aprendida.', error);
    return 0;
  }
}

export function guardarLatenciaAprendida(segundos) {
  try {
    window.localStorage.setItem(CLAVE_LATENCIA, String(segundos));
  } catch (error) {
    console.warn('No se pudo guardar la latencia aprendida.', error);
  }
}

export function guardarUltimoError(texto) {
  try {
    window.localStorage.setItem(CLAVE_ULTIMO_ERROR, JSON.stringify({ fecha: new Date().toISOString(), texto: String(texto).slice(0, LONGITUD_MAXIMA_ERROR) }));
  } catch (error) {
    console.warn('No se pudo guardar el último error.', error);
  }
}

export function leerUltimoError() {
  try {
    const texto = window.localStorage.getItem(CLAVE_ULTIMO_ERROR);
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    console.warn('No se pudo leer el último error.', error);
    return null;
  }
}

export function borrarProgreso() {
  copiaEnMemoria = null;
  try {
    window.localStorage.removeItem(CLAVE_PROGRESO);
    window.localStorage.removeItem(CLAVE_MICROFONO);
    window.localStorage.removeItem(CLAVE_LATENCIA);
  } catch (error) {
    console.warn('No se pudo borrar el progreso guardado.', error);
  }
}
