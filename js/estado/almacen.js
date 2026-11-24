// Persistencia en localStorage con copia en memoria si el almacenamiento falla (modo privado, cuota llena…).

const CLAVE_PROGRESO = 'alondra.progreso.v1';
const CLAVE_MICROFONO = 'alondra.microfono-permitido';

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

export function borrarProgreso() {
  copiaEnMemoria = null;
  try {
    window.localStorage.removeItem(CLAVE_PROGRESO);
    window.localStorage.removeItem(CLAVE_MICROFONO);
  } catch (error) {
    console.warn('No se pudo borrar el progreso guardado.', error);
  }
}
