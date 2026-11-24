// Rollo de pianola: las notas de una melodía en el tiempo, un cursor y la estela de la voz del usuario.

import { el, leerVariableCss, ajustarCanvas } from '../dom.js';
import { nombreNota } from '../../musica/notas.js';
import { segundosPorPulso } from '../../audio/sintetizador.js';
import { TOLERANCIA_CENTS_AFINADO, TOLERANCIA_CENTS_AMPLIA, UMBRAL_DOS_ESTRELLAS, UMBRAL_TRES_ESTRELLAS } from '../../ejercicios/puntuacion.js';

const PIXELES_POR_SEGUNDO = 110;
const POSICION_CURSOR_RELATIVA = 0.3;
const MARGEN_SEMITONOS = 2;
const ALTO_NOTA_RELATIVO = 0.8;
const RADIO_ESQUINA = 8;
const RADIO_PUNTO = 3.5;
const SEPARACION_NOTAS_SEGUNDOS = 0.04;

export function crearPianoRoll(notas, tempo, { etiqueta } = {}) {
  const canvas = el('canvas', { clase: 'piano-roll__canvas' });
  const elemento = el('div', { clase: 'piano-roll', role: 'img', 'aria-label': etiqueta }, canvas);
  const pulso = segundosPorPulso(tempo);
  const midisReales = notas.map((nota) => nota.midi).filter((midi) => midi !== null);
  const midiMinimo = Math.min(...midisReales) - MARGEN_SEMITONOS;
  const midiMaximo = Math.max(...midisReales) + MARGEN_SEMITONOS;

  let acumulado = 0;
  const segmentos = notas.map((nota, indice) => {
    const inicio = acumulado;
    acumulado += nota.pulsos * pulso;
    return { indice, midi: nota.midi, inicio, fin: acumulado, estado: null };
  });
  const duracion = acumulado;

  let tiempo = 0;
  const estela = [];
  let observador = null;

  function colores() {
    return {
      fondo: leerVariableCss('--superficie-1'),
      cuadricula: leerVariableCss('--contorno-suave'),
      nota: leerVariableCss('--primario-contenedor'),
      notaBorde: leerVariableCss('--primario'),
      notaTexto: leerVariableCss('--sobre-primario-contenedor'),
      notaActiva: leerVariableCss('--primario'),
      notaActivaTexto: leerVariableCss('--sobre-primario'),
      cursor: leerVariableCss('--sobre-superficie'),
      afinado: leerVariableCss('--acierto'),
      cerca: leerVariableCss('--aviso'),
      lejos: leerVariableCss('--error'),
      texto: leerVariableCss('--texto-suave'),
    };
  }

  function colorEstado(estado, paleta) {
    if (estado >= UMBRAL_TRES_ESTRELLAS) return paleta.afinado;
    if (estado >= UMBRAL_DOS_ESTRELLAS) return paleta.cerca;
    return paleta.lejos;
  }

  function colorMuestra(cents, paleta) {
    const desvio = Math.abs(cents);
    if (desvio <= TOLERANCIA_CENTS_AFINADO) return paleta.afinado;
    if (desvio <= TOLERANCIA_CENTS_AMPLIA) return paleta.cerca;
    return paleta.lejos;
  }

  function rectanguloRedondeado(contexto, x, y, ancho, alto, radio) {
    const r = Math.min(radio, ancho / 2, alto / 2);
    contexto.beginPath();
    contexto.moveTo(x + r, y);
    contexto.arcTo(x + ancho, y, x + ancho, y + alto, r);
    contexto.arcTo(x + ancho, y + alto, x, y + alto, r);
    contexto.arcTo(x, y + alto, x, y, r);
    contexto.arcTo(x, y, x + ancho, y, r);
    contexto.closePath();
  }

  function dibujar() {
    const { contexto, ancho, alto } = ajustarCanvas(canvas);
    const paleta = colores();
    contexto.clearRect(0, 0, ancho, alto);
    const xCursor = ancho * POSICION_CURSOR_RELATIVA;
    const xDeTiempo = (t) => xCursor + (t - tiempo) * PIXELES_POR_SEGUNDO;
    const altoFila = alto / (midiMaximo - midiMinimo + 1);
    const yDeMidi = (midi) => alto - (midi - midiMinimo + 0.5) * altoFila;

    contexto.strokeStyle = paleta.cuadricula;
    contexto.lineWidth = 1;
    for (let midi = midiMinimo; midi <= midiMaximo; midi++) {
      const y = yDeMidi(midi);
      contexto.beginPath();
      contexto.moveTo(0, y);
      contexto.lineTo(ancho, y);
      contexto.stroke();
    }

    contexto.font = `${Math.max(10, Math.min(13, altoFila * 0.55))}px system-ui, sans-serif`;
    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';
    for (const segmento of segmentos) {
      if (segmento.midi === null) continue;
      const x = xDeTiempo(segmento.inicio);
      const anchoNota = (segmento.fin - segmento.inicio - SEPARACION_NOTAS_SEGUNDOS) * PIXELES_POR_SEGUNDO;
      if (x + anchoNota < 0 || x > ancho) continue;
      const altoNota = altoFila * ALTO_NOTA_RELATIVO;
      const y = yDeMidi(segmento.midi) - altoNota / 2;
      const activa = tiempo >= segmento.inicio && tiempo < segmento.fin;
      rectanguloRedondeado(contexto, x, y, anchoNota, altoNota, RADIO_ESQUINA);
      if (segmento.estado !== null) contexto.fillStyle = colorEstado(segmento.estado, paleta);
      else contexto.fillStyle = activa ? paleta.notaActiva : paleta.nota;
      contexto.fill();
      if (segmento.estado === null && !activa) {
        contexto.strokeStyle = paleta.notaBorde;
        contexto.lineWidth = 1.5;
        contexto.stroke();
      }
      if (anchoNota > 30) {
        contexto.fillStyle = activa || segmento.estado !== null ? paleta.notaActivaTexto : paleta.notaTexto;
        contexto.fillText(nombreNota(segmento.midi, false), x + anchoNota / 2, y + altoNota / 2);
      }
    }

    for (const muestra of estela) {
      const x = xDeTiempo(muestra.tiempo);
      if (x < 0 || x > ancho) continue;
      contexto.fillStyle = colorMuestra(muestra.cents, paleta);
      contexto.beginPath();
      contexto.arc(x, yDeMidi(muestra.midi), RADIO_PUNTO, 0, Math.PI * 2);
      contexto.fill();
    }

    contexto.strokeStyle = paleta.cursor;
    contexto.lineWidth = 2;
    contexto.beginPath();
    contexto.moveTo(xCursor, 0);
    contexto.lineTo(xCursor, alto);
    contexto.stroke();
  }

  function segmentoEn(t) {
    return segmentos.find((segmento) => t >= segmento.inicio && t < segmento.fin) ?? null;
  }

  return {
    elemento,
    duracion,
    segmentos,
    fijarTiempo(nuevoTiempo) {
      tiempo = nuevoTiempo;
      dibujar();
    },
    registrarMuestra(tiempoMuestra, midi) {
      const segmento = segmentoEn(tiempoMuestra);
      const cents = segmento && segmento.midi !== null ? (midi - segmento.midi) * 100 : 0;
      estela.push({ tiempo: tiempoMuestra, midi, cents });
    },
    // Sustituye la estela por muestras ya alineadas en el tiempo.
    reemplazarEstela(muestras) {
      estela.length = 0;
      for (const muestra of muestras) this.registrarMuestra(muestra.tiempo, muestra.midi);
    },
    marcarNota(indice, puntuacion) {
      segmentos[indice].estado = puntuacion;
      dibujar();
    },
    reiniciar() {
      estela.length = 0;
      segmentos.forEach((segmento) => {
        segmento.estado = null;
      });
      tiempo = 0;
      dibujar();
    },
    montar() {
      observador = new ResizeObserver(() => dibujar());
      observador.observe(canvas);
      dibujar();
    },
    destruir() {
      observador?.disconnect();
    },
  };
}
