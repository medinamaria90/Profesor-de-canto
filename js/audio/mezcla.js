// Mesa de mezclas: todos los instrumentos pasan por un compresor suave y pueden enviar parte de su
// señal a una reverberación común, generada aquí mismo (ruido que se apaga) para no cargar archivos.

const SEGUNDOS_REVERB = 2.2;
const CAIDA_REVERB = 3.2;
const CANALES = 2;
const RETORNO_REVERB = 0.32;
const GANANCIA_SALIDA = 0.9;

const mesas = new WeakMap();

function impulsoReverb(contexto) {
  const muestras = Math.floor(contexto.sampleRate * SEGUNDOS_REVERB);
  const buffer = contexto.createBuffer(CANALES, muestras, contexto.sampleRate);
  for (let canal = 0; canal < CANALES; canal++) {
    const datos = buffer.getChannelData(canal);
    for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras) ** CAIDA_REVERB;
  }
  return buffer;
}

function crearMesa(contexto) {
  const compresor = contexto.createDynamicsCompressor();
  compresor.threshold.value = -18;
  compresor.knee.value = 12;
  compresor.ratio.value = 3;
  compresor.attack.value = 0.01;
  compresor.release.value = 0.25;
  const salida = contexto.createGain();
  salida.gain.value = GANANCIA_SALIDA;
  compresor.connect(salida).connect(contexto.destination);
  const reverb = contexto.createConvolver();
  reverb.buffer = impulsoReverb(contexto);
  const retorno = contexto.createGain();
  retorno.gain.value = RETORNO_REVERB;
  reverb.connect(retorno).connect(compresor);
  return { seco: compresor, reverb };
}

export function obtenerMesa(contexto) {
  let mesa = mesas.get(contexto);
  if (!mesa) {
    mesa = crearMesa(contexto);
    mesas.set(contexto, mesa);
  }
  return mesa;
}

// Conecta la salida de un instrumento a la mesa: directa y, con `envio` > 0, también a la reverberación.
export function conectarAMesa(contexto, nodo, envio = 0) {
  const mesa = obtenerMesa(contexto);
  nodo.connect(mesa.seco);
  if (envio <= 0) return;
  const ganancia = contexto.createGain();
  ganancia.gain.value = envio;
  nodo.connect(ganancia).connect(mesa.reverb);
}
