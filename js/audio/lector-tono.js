// Lee la entrada de audio en cada fotograma, detecta el tono y lo suaviza con una mediana.

import { detectarTono, calcularRms } from './deteccion-tono.js';
import { frecuenciaAMidi, midiAFrecuencia } from '../musica/notas.js';

const TAMANO_MEDIANA = 3;
// Se promedian pares de muestras antes de detectar: la voz cabe de sobra en la mitad de la frecuencia
// de muestreo y la autocorrelación cuesta cuatro veces menos.
const FACTOR_DIEZMADO = 2;

function diezmar(buffer, destino) {
  for (let i = 0; i < destino.length; i++) {
    destino[i] = (buffer[i * FACTOR_DIEZMADO] + buffer[i * FACTOR_DIEZMADO + 1]) / 2;
  }
  return destino;
}

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
}

// alLeer recibe { voz: true, midi, frecuencia, claridad, nivel } o { voz: false, nivel }.
export function crearLectorTono(entrada, alLeer) {
  let animacion = null;
  const historial = [];
  let reducido = null;

  function paso() {
    const buffer = entrada.leer();
    reducido ??= new Float32Array(Math.floor(buffer.length / FACTOR_DIEZMADO));
    const deteccion = detectarTono(diezmar(buffer, reducido), entrada.frecuenciaMuestreo / FACTOR_DIEZMADO);
    if (deteccion) {
      historial.push(frecuenciaAMidi(deteccion.frecuencia));
      if (historial.length > TAMANO_MEDIANA) historial.shift();
      const midi = mediana(historial);
      alLeer({ voz: true, midi, frecuencia: midiAFrecuencia(midi), claridad: deteccion.claridad, nivel: deteccion.rms });
    } else {
      historial.length = 0;
      alLeer({ voz: false, nivel: calcularRms(buffer) });
    }
    animacion = requestAnimationFrame(paso);
  }

  return {
    iniciar() {
      if (animacion === null) animacion = requestAnimationFrame(paso);
    },
    detener() {
      if (animacion !== null) cancelAnimationFrame(animacion);
      animacion = null;
      historial.length = 0;
    },
  };
}
