// Fachada de audio para las pantallas: una entrada compartida (micrófono o simulada), lector de tono y sintetizador.

import { obtenerContexto, reanudarContexto } from './contexto.js';
import { abrirMicrofono, ErrorMicrofono } from './microfono.js';
import { crearEntradaSimulada } from './entrada-simulada.js';
import { crearLectorTono, fotogramasPorSegundoDelDetector } from './lector-tono.js';
import * as sintetizador from './sintetizador.js';
import { reproducirAcompanamiento } from './acompanamiento.js';
import { CONFIGURACION } from '../nucleo/configuracion.js';
import { TAMANO_BLOQUE } from './microfono.js';
import { leerPermisoMicrofono, guardarPermisoMicrofono, leerLatenciaAprendida, guardarLatenciaAprendida } from '../estado/almacen.js';

// La latencia aprendida se actualiza con suavidad para no saltar con una sola melodía rara.
const PESO_LATENCIA_NUEVA = 0.5;

// Si el navegador no informa de su latencia de salida, se asume la típica de un móvil.
const LATENCIA_SALIDA_POR_DEFECTO_SEGUNDOS = 0.08;

let entrada = null;
let aperturaPendiente = null;
const acompanamientosActivos = new Set();
// Cada apertura lleva un número; si se cierra la entrada mientras se abre, el resultado se descarta.
let generacion = 0;
// Tras conceder el permiso una vez (en esta visita o en otra anterior), no se vuelve a mostrar la tarjeta.
let permisoConcedido = false;

async function permisoDelNavegador() {
  if (!navigator.permissions?.query) return false;
  try {
    const resultado = await navigator.permissions.query({ name: 'microphone' });
    return resultado.state === 'granted';
  } catch (error) {
    // Algunos navegadores no reconocen el permiso "microphone"; se seguirá preguntando.
    console.warn('No se pudo consultar el permiso de micrófono.', error);
    return false;
  }
}

export const audio = {
  esSimulado: CONFIGURACION.simulacion,

  async preparar() {
    return reanudarContexto();
  },

  tieneEntrada() {
    return entrada !== null;
  },

  // true si se puede abrir el micrófono sin mostrar antes la tarjeta explicativa.
  async puedeAbrirSinPreguntar() {
    if (CONFIGURACION.simulacion || permisoConcedido || leerPermisoMicrofono()) return true;
    return permisoDelNavegador();
  },

  // Libera el micrófono: se llama al salir de cualquier pantalla que lo use.
  cerrarEntrada() {
    generacion++;
    if (!entrada) return;
    entrada.cerrar();
    entrada = null;
  },

  async abrirEntrada() {
    if (entrada) return entrada;
    if (aperturaPendiente) {
      // Una apertura anterior puede haberse cancelado al cerrar otra pantalla: se vuelve a pedir.
      return aperturaPendiente.catch((error) => (error.motivo === 'cancelado' ? this.abrirEntrada() : Promise.reject(error)));
    }
    {
      const miGeneracion = ++generacion;
      const contexto = await reanudarContexto();
      aperturaPendiente = (CONFIGURACION.simulacion ? Promise.resolve(crearEntradaSimulada(contexto)) : abrirMicrofono(contexto))
        .then((nueva) => {
          if (miGeneracion !== generacion) {
            // La pantalla que pidió el micrófono ya se cerró: se libera sin usarlo.
            nueva.cerrar();
            throw new ErrorMicrofono('cancelado');
          }
          entrada = nueva;
          permisoConcedido = true;
          if (!CONFIGURACION.simulacion) guardarPermisoMicrofono();
          return nueva;
        })
        .finally(() => {
          aperturaPendiente = null;
        });
    }
    return aperturaPendiente;
  },

  crearLector(alLeer) {
    if (!entrada) throw new Error('No hay entrada de audio abierta');
    return crearLectorTono(entrada, alLeer);
  },

  ahora() {
    return obtenerContexto().currentTime;
  },

  // Desfase entre el instante programado de un sonido y el momento en que la voz que lo sigue
  // llega analizada: lo que tarda el altavoz, lo que tarda el micrófono y medio bloque de análisis.
  latenciaSegundos() {
    const contexto = obtenerContexto();
    const salida = contexto.outputLatency || LATENCIA_SALIDA_POR_DEFECTO_SEGUNDOS;
    const entrada = contexto.baseLatency || 0;
    return salida + entrada + TAMANO_BLOQUE / contexto.sampleRate / 2 + leerLatenciaAprendida();
  },

  // Datos para entender el comportamiento del audio en este dispositivo.
  diagnostico() {
    const contexto = obtenerContexto();
    return {
      frecuenciaMuestreo: contexto.sampleRate,
      latenciaSalida: contexto.outputLatency ?? null,
      latenciaEntrada: contexto.baseLatency ?? null,
      latenciaAprendida: leerLatenciaAprendida(),
      fotogramasPorSegundo: fotogramasPorSegundoDelDetector(),
    };
  },

  // Tras una melodía, el desfase sobrante que se detectó se incorpora a la latencia aprendida.
  aprenderLatencia(desfaseSobrante) {
    const actual = leerLatenciaAprendida();
    const nueva = Math.max(0, actual + desfaseSobrante * PESO_LATENCIA_NUEVA);
    guardarLatenciaAprendida(Math.round(nueva * 1000) / 1000);
  },

  reproducirNota(midi, duracion, opciones) {
    return sintetizador.reproducirNota(obtenerContexto(), midi, duracion, opciones);
  },

  reproducirSecuencia(notas, tempo, opciones) {
    return sintetizador.reproducirSecuencia(obtenerContexto(), notas, tempo, opciones);
  },

  clickMetronomo(cuando, acento) {
    sintetizador.clickMetronomo(obtenerContexto(), cuando, acento);
  },

  reproducirAcompanamiento(acompanamiento, opciones) {
    const control = reproducirAcompanamiento(obtenerContexto(), acompanamiento, opciones);
    acompanamientosActivos.add(control);
    return control;
  },

  detenerTodo() {
    sintetizador.detenerTodo();
    for (const control of acompanamientosActivos) control.detener();
    acompanamientosActivos.clear();
  },
};
