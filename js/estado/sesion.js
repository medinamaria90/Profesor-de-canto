// Datos efímeros de la sesión (no se guardan): el resultado de la última lección para la pantalla de resultados.

const CLAVE_RESULTADO = 'alondra.ultimo-resultado';
let ultimoResultado = null;

export function guardarResultadoLeccion(resultado) {
  ultimoResultado = resultado;
  try {
    window.sessionStorage.setItem(CLAVE_RESULTADO, JSON.stringify(resultado));
  } catch (error) {
    console.warn('No se pudo guardar el resultado para una recarga.', error);
  }
}

export function leerResultadoLeccion() {
  if (ultimoResultado) return ultimoResultado;
  try {
    return JSON.parse(window.sessionStorage.getItem(CLAVE_RESULTADO));
  } catch (error) {
    console.warn('No se pudo leer el resultado guardado.', error);
    return null;
  }
}

export function olvidarResultadoLeccion() {
  ultimoResultado = null;
  try {
    window.sessionStorage.removeItem(CLAVE_RESULTADO);
  } catch (error) {
    console.warn('No se pudo borrar el resultado guardado.', error);
  }
}

let avisosPendientes = [];

// Mensajes cortos (por ejemplo, logros conseguidos) que la siguiente pantalla muestra en un aviso.
export function guardarAvisosPendientes(avisos) {
  avisosPendientes = [...avisosPendientes, ...avisos];
}

export function consumirAvisosPendientes() {
  const avisos = avisosPendientes;
  avisosPendientes = [];
  return avisos;
}
