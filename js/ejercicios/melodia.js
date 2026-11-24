// Ejercicio: escuchar una melodía y cantarla siguiendo el rollo de pianola.

import { el } from '../ui/dom.js';
import { audio } from '../audio/servicio-audio.js';
import { segundosPorPulso, GANANCIA_ACOMPANAMIENTO } from '../audio/sintetizador.js';
import { PULSOS_POR_COMPAS } from '../musica/arreglos.js';
import { CENTS_POR_SEMITONO } from '../musica/notas.js';
import { crearPianoRoll } from '../ui/componentes/piano-roll.js';
import { puntuarMuestras, puntuarMuestrasTolerante, puntuarMelodia, estimarDesfase, UMBRAL_DOS_ESTRELLAS } from './puntuacion.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, capturarEnTiempo } from './comun.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.melodia;
const PULSOS_CUENTA_ATRAS = 2;
const RETARDO_INICIO_SEGUNDOS = 0.15;
// El arranque de cada nota se ignora para no penalizar el tiempo de reacción.
const FRACCION_INICIO_IGNORADA = 0.3;
const COLA_TRAS_MELODIA_SEGUNDOS = 0.3;

export function crearEjercicioMelodia(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const esCancion = ejercicio.tipo === 'cancion';
  const TC = TEXTOS.ejercicios.cancion;
  const tipoTexto = esCancion ? (ejercicio.modo === 'frase' ? TC.fraseFormato(ejercicio.frase + 1, ejercicio.totalFrases) : TC.titulo) : T.titulo;
  const cabecera = crearCabeceraEjercicio(tipoTexto, T.instruccionEscucha);
  const pulso = segundosPorPulso(ejercicio.tempo);
  // En una frase intermedia, el acompañamiento arranca en el compás y la melodía entra unos pulsos después.
  const entrada = (ejercicio.pulsosDeEntrada ?? 0) * pulso;
  const notasConEntrada = entrada > 0 ? [{ midi: null, pulsos: ejercicio.pulsosDeEntrada }, ...ejercicio.notas] : ejercicio.notas;
  const rollo = crearPianoRoll(notasConEntrada, ejercicio.tempo, { etiqueta: ejercicio.titulo });
  const estado = crearEstadoEjercicio();
  contenedor.append(
    cabecera.elemento,
    el('p', { clase: 'melodia__titulo', texto: esCancion && ejercicio.autor ? `${ejercicio.titulo} · ${ejercicio.autor}` : ejercicio.titulo }),
    rollo.elemento,
    estado,
  );
  let animacion = null;
  let captura = null;
  let destruido = false;

  function duracionTotal() {
    const acompanamiento = ejercicio.acompanamiento ? ejercicio.acompanamiento.compases * PULSOS_POR_COMPAS * pulso : 0;
    return Math.max(rollo.duracion, acompanamiento);
  }

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
    if (ejercicio.acompanamiento) audio.reproducirAcompanamiento(ejercicio.acompanamiento, { cuando: inicio });
    audio.reproducirSecuencia(notasConEntrada, ejercicio.tempo, { cuando: inicio });
    const animar = () => {
      const tiempo = audio.ahora() - inicio;
      rollo.fijarTiempo(tiempo);
      if (tiempo < duracionTotal() + COLA_TRAS_MELODIA_SEGUNDOS) {
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
    cabecera.fijarInstruccion(esCancion ? TC.instruccionCanta : T.instruccionCanta);
    contenedor.classList.add('ejercicio--grabando');
    const inicio = audio.ahora() + RETARDO_INICIO_SEGUNDOS + PULSOS_CUENTA_ATRAS * pulso;
    for (let i = PULSOS_CUENTA_ATRAS; i >= 1; i--) audio.clickMetronomo(inicio - i * pulso, i === PULSOS_CUENTA_ATRAS);
    if (ejercicio.acompanamiento) audio.reproducirAcompanamiento(ejercicio.acompanamiento, { cuando: inicio, ganancia: 0.8 });
    audio.reproducirSecuencia(notasConEntrada, ejercicio.tempo, { cuando: inicio, ganancia: GANANCIA_ACOMPANAMIENTO });
    captura = capturarEnTiempo({
      inicioAudio: inicio,
      duracion: duracionTotal(),
      alTiempo: (tiempo) => {
        rollo.fijarTiempo(tiempo);
        const texto = tiempo < 0 ? `${Math.ceil(-tiempo / pulso)}…` : TEXTOS.leccion.cantaAhora;
        if (estado.textContent !== texto) estado.textContent = texto;
      },
      alMuestra: (midi, tiempo) => rollo.registrarMuestra(tiempo, midi),
    });
    captura.promesa.then((resultado) => {
      contenedor.classList.remove('ejercicio--grabando');
      if (destruido || resultado.cancelado) return;
      evaluar(resultado.muestras);
    });
  }

  function evaluar(muestrasCrudas) {
    // La voz llega con retraso (auriculares, altavoz, reacción): se alinea con la melodía antes de puntuar.
    const desfase = estimarDesfase(muestrasCrudas, rollo.segmentos);
    const muestras = muestrasCrudas.map((muestra) => ({ ...muestra, tiempo: muestra.tiempo - desfase }));
    if (desfase > 0) {
      audio.aprenderLatencia(desfase);
      rollo.reemplazarEstela(muestras);
    }
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
    rollo.mostrarResumen();
    alTerminar({
      puntuacion: puntuarMelodia(puntuaciones),
      detalle: `${T.notasFormato(afinadas, puntuaciones.length)} · ${T.desfaseFormato(desfase)}`,
      errorMedio: puntuarMuestras(todosLosCents).errorMedio,
    });
  }

  return {
    iniciar() {
      rollo.montar();
      faseEscuchar();
    },
    pausar() {
      detenerAnimacion();
      captura?.cancelar();
      contenedor.classList.remove('ejercicio--grabando');
      fijarAcciones([]);
    },
    reanudar() {
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
