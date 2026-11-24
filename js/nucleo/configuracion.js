// Opciones de arranque leídas de la URL.

const parametros = new URLSearchParams(window.location.search);

export const CONFIGURACION = Object.freeze({
  // ?simulacion=1 sustituye el micrófono por una voz sintética para probar sin hardware.
  simulacion: parametros.get('simulacion') === '1',
});
