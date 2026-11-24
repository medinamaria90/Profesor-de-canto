// Fachada de audio para las pantallas: una entrada compartida (micrófono o simulada), lector de tono y sintetizador.

import { obtenerContexto, reanudarContexto } from './contexto.js';
import { abrirMicrofono } from './microfono.js';
import { crearEntradaSimulada } from './entrada-simulada.js';
import { crearLectorTono } from './lector-tono.js';
import * as sintetizador from './sintetizador.js';
import { CONFIGURACION } from '../nucleo/configuracion.js';

let entrada = null;
let aperturaPendiente = null;

export const audio = {
  esSimulado: CONFIGURACION.simulacion,

  async preparar() {
    return reanudarContexto();
  },

  tieneEntrada() {
    return entrada !== null;
  },

  async abrirEntrada() {
    if (entrada) return entrada;
    if (!aperturaPendiente) {
      const contexto = await reanudarContexto();
      aperturaPendiente = (CONFIGURACION.simulacion ? Promise.resolve(crearEntradaSimulada(contexto)) : abrirMicrofono(contexto))
        .then((nueva) => {
          entrada = nueva;
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

  reproducirNota(midi, duracion, opciones) {
    return sintetizador.reproducirNota(obtenerContexto(), midi, duracion, opciones);
  },

  reproducirSecuencia(notas, tempo, opciones) {
    return sintetizador.reproducirSecuencia(obtenerContexto(), notas, tempo, opciones);
  },

  clickMetronomo(cuando, acento) {
    sintetizador.clickMetronomo(obtenerContexto(), cuando, acento);
  },

  detenerTodo() {
    sintetizador.detenerTodo();
  },
};
