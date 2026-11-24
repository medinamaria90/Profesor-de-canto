// Datos efímeros de la sesión (no se guardan): el resultado de la última lección para la pantalla de resultados.

let ultimoResultado = null;

export function guardarResultadoLeccion(resultado) {
  ultimoResultado = resultado;
}

export function consumirResultadoLeccion() {
  const resultado = ultimoResultado;
  ultimoResultado = null;
  return resultado;
}
