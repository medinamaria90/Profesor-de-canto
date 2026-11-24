// Acceso al micrófono: devuelve una "entrada" de la que se leen bloques de muestras.

export const TAMANO_BLOQUE = 2048;

export class ErrorMicrofono extends Error {
  constructor(motivo, causa) {
    super(`Micrófono no disponible: ${motivo}`);
    this.name = 'ErrorMicrofono';
    this.motivo = motivo;
    this.causa = causa;
  }
}

const RESTRICCIONES = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
};

function clasificarError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'denegado';
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'sin-dispositivo';
  return 'fallo';
}

export async function abrirMicrofono(contexto) {
  if (!navigator.mediaDevices?.getUserMedia) throw new ErrorMicrofono('sin-soporte');
  let flujo;
  try {
    flujo = await navigator.mediaDevices.getUserMedia(RESTRICCIONES);
  } catch (error) {
    throw new ErrorMicrofono(clasificarError(error), error);
  }
  const fuente = contexto.createMediaStreamSource(flujo);
  const analizador = contexto.createAnalyser();
  analizador.fftSize = TAMANO_BLOQUE;
  fuente.connect(analizador);
  const buffer = new Float32Array(TAMANO_BLOQUE);
  return {
    simulada: false,
    frecuenciaMuestreo: contexto.sampleRate,
    leer() {
      analizador.getFloatTimeDomainData(buffer);
      return buffer;
    },
    cerrar() {
      flujo.getTracks().forEach((pista) => pista.stop());
      fuente.disconnect();
    },
  };
}
