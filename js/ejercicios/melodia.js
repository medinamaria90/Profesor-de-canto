// Ejercicio: escuchar una melodía y cantarla siguiendo el rollo de pianola.

import { el } from '../ui/dom.js';
import { audio } from '../audio/servicio-audio.js';
import { segundosPorPulso, GANANCIA_ACOMPANAMIENTO } from '../audio/sintetizador.js';
import { CENTS_POR_SEMITONO } from '../musica/notas.js';
import { crearPianoRoll } from '../ui/componentes/piano-roll.js';
import { puntuarMuestras, puntuarMuestrasTolerante, puntuarMelodia, UMBRAL_DOS_ESTRELLAS } from './puntuacion.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, capturarEnTiempo } from './comun.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.melodia;
const PULSOS_CUENTA_ATRAS = 2;
const RETARDO_INICIO_SEGUNDOS = 0.15;
// El arranque de cada nota se ignora para no penalizar el tiempo de reacción.
const FRACCION_INICIO_IGNORADA = 0.3;
const COLA_TRAS_MELODIA_SEGUNDOS = 0.3;

export function crearEjercicioMelodia(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, T.instruccionEscucha);
  const rollo = crearPianoRoll(ejercicio.notas, ejercicio.tempo, { etiqueta: ejercicio.titulo });
  const estado = crearEstadoEjercicio();
  contenedor.append(cabecera.elemento, el('p', { clase: 'melodia__titulo', texto: ejercicio.titulo }), rollo.elemento, estado);

  const pulso = segundosPorPulso(ejercicio.tempo);
  let animacion = null;
  let captura = null;
  let destruido = false;

  function detenerAnimacion() {
    if (animacion !== null) cancelAnimationFrame(animacion);
    animacion = null;
  }

  function faseEscuchar() {
    fijarAcciones([]);
    detenerAnimacion();
    captura?.cancelar();
    audio.detenerTodo();
    rollo.reiniciar();
    cabecera.fijarInstruccion(T.instruccionEscucha);
    estado.textContent = `${TEXTOS.leccion.escuchar}…`;
    const inicio = audio.ahora() + RETARDO_INICIO_SEGUNDOS;
    audio.reproducirSecuencia(ejercicio.notas, ejercicio.tempo, { cuando: inicio });
    const animar = () => {
      const tiempo = audio.ahora() - inicio;
      rollo.fijarTiempo(tiempo);
      if (tiempo < rollo.duracion + COLA_TRAS_MELODIA_SEGUNDOS) {
        animacion = requestAnimationFrame(animar);
        return;
      }
      animacion = null;
      estado.textContent = '';
      fijarAcciones([
        { texto: TEXTOS.leccion.tuTurno, accion: faseCantar },
        { texto: TEXTOS.leccion.escucharOtraVez, variante: 'tonal', accion: faseEscuchar },
      ]);
    };
    animacion = requestAnimationFrame(animar);
  }

  function faseCantar() {
    fijarAcciones([]);
    detenerAnimacion();
    rollo.reiniciar();
    cabecera.fijarInstruccion(T.instruccionCanta);
    contenedor.classList.add('ejercicio--grabando');
    const inicio = audio.ahora() + RETARDO_INICIO_SEGUNDOS + PULSOS_CUENTA_ATRAS * pulso;
    for (let i = PULSOS_CUENTA_ATRAS; i >= 1; i--) audio.clickMetronomo(inicio - i * pulso, i === PULSOS_CUENTA_ATRAS);
    audio.reproducirSecuencia(ejercicio.notas, ejercicio.tempo, { cuando: inicio, ganancia: GANANCIA_ACOMPANAMIENTO });
    captura = capturarEnTiempo({
      inicioAudio: inicio,
      duracion: rollo.duracion,
      alTiempo: (tiempo) => {
        rollo.fijarTiempo(tiempo);
        estado.textContent = tiempo < 0 ? `${Math.ceil(-tiempo / pulso)}…` : TEXTOS.leccion.cantaAhora;
      },
      alMuestra: (midi, tiempo) => rollo.registrarMuestra(tiempo, midi),
    });
    captura.promesa.then((resultado) => {
      contenedor.classList.remove('ejercicio--grabando');
      if (destruido || resultado.cancelado) return;
      evaluar(resultado.muestras);
    });
  }

  function evaluar(muestras) {
    const puntuaciones = [];
    const todosLosCents = [];
    let afinadas = 0;
    for (const segmento of rollo.segmentos) {
      if (segmento.midi === null) continue;
      const desde = segmento.inicio + (segmento.fin - segmento.inicio) * FRACCION_INICIO_IGNORADA;
      const cents = muestras
        .filter((muestra) => muestra.tiempo >= desde && muestra.tiempo < segmento.fin)
        .map((muestra) => (muestra.midi - segmento.midi) * CENTS_POR_SEMITONO);
      const { puntuacion } = puntuarMuestrasTolerante(cents);
      puntuaciones.push(puntuacion);
      todosLosCents.push(...cents);
      if (puntuacion >= UMBRAL_DOS_ESTRELLAS) afinadas++;
      rollo.marcarNota(segmento.indice, puntuacion);
    }
    estado.textContent = '';
    alTerminar({
      puntuacion: puntuarMelodia(puntuaciones),
      detalle: T.notasFormato(afinadas, puntuaciones.length),
      errorMedio: puntuarMuestras(todosLosCents).errorMedio,
    });
  }

  return {
    iniciar() {
      rollo.montar();
      faseEscuchar();
    },
    destruir() {
      destruido = true;
      detenerAnimacion();
      captura?.cancelar();
      rollo.destruir();
    },
  };
}
