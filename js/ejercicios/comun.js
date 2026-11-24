// Piezas compartidas por los ejercicios: cabecera, notas guía y captura de la voz.

import { el, esperar } from '../ui/dom.js';
import { audio } from '../audio/servicio-audio.js';

export const MS_VOZ_PARA_INICIO = 200;
export const MS_ESPERA_VOZ_MAXIMA = 8000;
export const SEGUNDOS_ENTRE_NOTAS_GUIA = 0.9;
export const DURACION_NOTA_GUIA_SEGUNDOS = 0.8;
export const PAUSA_TRAS_GUIA_MS = 450;
const RETARDO_PROGRAMACION_SEGUNDOS = 0.05;

export function crearCabeceraEjercicio(tipo, instruccion) {
  const textoInstruccion = el('h2', { clase: 'ejercicio__instruccion', texto: instruccion });
  const elemento = el('header', { clase: 'ejercicio__cabecera' }, el('p', { clase: 'ejercicio__tipo', texto: tipo }), textoInstruccion);
  return {
    elemento,
    fijarInstruccion(texto) {
      textoInstruccion.textContent = texto;
    },
  };
}

export function crearEstadoEjercicio() {
  return el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite' });
}

// Reproduce notas guía una tras otra y espera a que terminen.
export async function reproducirGuia(midis) {
  const inicio = audio.ahora() + RETARDO_PROGRAMACION_SEGUNDOS;
  midis.forEach((midi, indice) => {
    audio.reproducirNota(midi, DURACION_NOTA_GUIA_SEGUNDOS, { cuando: inicio + indice * SEGUNDOS_ENTRE_NOTAS_GUIA });
  });
  const total = (midis.length - 1) * SEGUNDOS_ENTRE_NOTAS_GUIA + DURACION_NOTA_GUIA_SEGUNDOS;
  await esperar(total * 1000 + PAUSA_TRAS_GUIA_MS);
}

// Espera a que el usuario empiece a cantar y recoge `duracion` segundos de voz.
// Resuelve { iniciado, muestras: [{ tiempo, midi }], cancelado }.
// Con silencioParaTerminar (ms), la captura acaba también cuando el usuario deja de cantar ese tiempo.
export function capturarTrasVoz({ duracion, esperaMaxima = MS_ESPERA_VOZ_MAXIMA, silencioParaTerminar = null, alInicio, alMuestra, alProgreso }) {
  let resolverPromesa;
  const promesa = new Promise((resolver) => {
    resolverPromesa = resolver;
  });
  const muestras = [];
  const arranque = performance.now();
  let primeraVoz = null;
  let inicio = null;
  let ultimaVoz = null;
  let terminado = false;

  const terminar = (resultado) => {
    if (terminado) return;
    terminado = true;
    lector.detener();
    resolverPromesa(resultado);
  };

  const lector = audio.crearLector((lectura) => {
    const ahora = performance.now();
    if (inicio === null) {
      if (!lectura.voz) {
        primeraVoz = null;
        if (ahora - arranque > esperaMaxima) terminar({ iniciado: false, muestras, cancelado: false });
        return;
      }
      primeraVoz ??= ahora;
      if (ahora - primeraVoz < MS_VOZ_PARA_INICIO) return;
      inicio = ahora;
      alInicio?.();
    }
    const transcurrido = (ahora - inicio) / 1000;
    if (lectura.voz) {
      ultimaVoz = ahora;
      muestras.push({ tiempo: transcurrido, midi: lectura.midi });
      alMuestra?.(lectura.midi, transcurrido);
    }
    alProgreso?.(Math.min(1, transcurrido / duracion));
    const calladoDemasiado = silencioParaTerminar !== null && ultimaVoz !== null && ahora - ultimaVoz >= silencioParaTerminar;
    if (transcurrido >= duracion || calladoDemasiado) terminar({ iniciado: true, muestras, cancelado: false });
  });
  lector.iniciar();

  return {
    promesa,
    cancelar() {
      terminar({ iniciado: false, muestras, cancelado: true });
    },
  };
}

// Captura ligada al reloj de audio: desde `inicioAudio` (segundos del AudioContext) durante `duracion`.
export function capturarEnTiempo({ inicioAudio, duracion, alTiempo, alMuestra }) {
  let resolverPromesa;
  const promesa = new Promise((resolver) => {
    resolverPromesa = resolver;
  });
  const muestras = [];
  let terminado = false;

  const terminar = (resultado) => {
    if (terminado) return;
    terminado = true;
    lector.detener();
    resolverPromesa(resultado);
  };

  const lector = audio.crearLector((lectura) => {
    const tiempo = audio.ahora() - inicioAudio;
    alTiempo?.(tiempo);
    if (tiempo >= 0 && lectura.voz) {
      muestras.push({ tiempo, midi: lectura.midi });
      alMuestra?.(lectura.midi, tiempo);
    }
    if (tiempo >= duracion) terminar({ muestras, cancelado: false });
  });
  lector.iniciar();

  return {
    promesa,
    cancelar() {
      terminar({ muestras, cancelado: true });
    },
  };
}

export function elegirAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}
