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
