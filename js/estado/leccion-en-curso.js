// Guarda la lección en curso en la sesión del navegador para reanudarla si se recarga la página.

const CLAVE = 'alondra.leccion-en-curso';

export function leerLeccionEnCurso(leccionId) {
  try {
    const texto = window.sessionStorage.getItem(CLAVE);
    if (!texto) return null;
    const guardada = JSON.parse(texto);
    return guardada.leccionId === leccionId ? guardada : null;
  } catch (error) {
    console.warn('No se pudo leer la lección en curso.', error);
    return null;
  }
}

export function guardarLeccionEnCurso(datos) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch (error) {
    console.warn('No se pudo guardar la lección en curso.', error);
  }
}

export function borrarLeccionEnCurso() {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch (error) {
    console.warn('No se pudo borrar la lección en curso.', error);
  }
}
