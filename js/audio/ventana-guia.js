// Ventana en la que suena una nota guía por el altavoz. El micrófono la oye y la tomaría por voz,
// así que mientras dura (más una cola de reverberación y latencia) la lectura de tono no cuenta.

export const COLA_GUIA_SEGUNDOS = 0.15;

export function crearVentanaGuia() {
  let hasta = -Infinity;
  return {
    marcar(inicio, duracion) {
      hasta = Math.max(hasta, inicio + duracion + COLA_GUIA_SEGUNDOS);
    },
    activa(ahora) {
      return ahora < hasta;
    },
  };
}
