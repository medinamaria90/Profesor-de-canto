// Visor de afinación: una línea objetivo y la estela de la voz que se desplaza hacia la izquierda.

import { el, leerVariableCss, ajustarCanvas } from '../dom.js';
import { nombreNota } from '../../musica/notas.js';
import { TOLERANCIA_CENTS_AFINADO, TOLERANCIA_CENTS_AMPLIA } from '../../ejercicios/puntuacion.js';

const VENTANA_SEGUNDOS = 4;
const AMPLITUD_SEMITONOS_POR_DEFECTO = 8;
const RADIO_PUNTO = 4;
const RADIO_PUNTO_ACTUAL = 9;
const GROSOR_OBJETIVO = 3;
const ALTO_BANDA_RELATIVO = TOLERANCIA_CENTS_AFINADO / 100;
// Con poco alto por semitono, solo se etiquetan las notas naturales; con muy poco, solo los Do.
const ALTO_FILA_TODAS_LAS_ETIQUETAS = 22;
const ALTO_FILA_SOLO_NATURALES = 16;
const ALTO_MINIMO_ETIQUETA = 10;
const SEMITONOS_CON_SOSTENIDO = new Set([1, 3, 6, 8, 10]);
const GRADOS_DO_Y_SOL = new Set([0, 7]);

function mereceEtiqueta(midi, altoFila) {
  if (altoFila >= ALTO_FILA_TODAS_LAS_ETIQUETAS) return true;
  const grado = ((midi % 12) + 12) % 12;
  if (altoFila >= ALTO_FILA_SOLO_NATURALES) return !SEMITONOS_CON_SOSTENIDO.has(grado);
  return GRADOS_DO_Y_SOL.has(grado);
}

export function crearAfinadorVisual({ midiObjetivo = null, amplitudSemitonos = AMPLITUD_SEMITONOS_POR_DEFECTO, etiqueta } = {}) {
  const canvas = el('canvas', { clase: 'afinador-visual__canvas' });
  const elemento = el('div', { clase: 'afinador-visual', role: 'img', 'aria-label': etiqueta }, canvas);
  let objetivo = midiObjetivo;
  let centro = midiObjetivo ?? 60;
  let amplitud = amplitudSemitonos;
  const estela = [];
  let observador = null;

  function colores() {
    return {
      cuadricula: leerVariableCss('--contorno-suave'),
      texto: leerVariableCss('--texto-suave'),
      objetivo: leerVariableCss('--primario'),
      banda: leerVariableCss('--primario-contenedor'),
      afinado: leerVariableCss('--acierto'),
      cerca: leerVariableCss('--aviso'),
      lejos: leerVariableCss('--error'),
    };
  }

  function colorPorDesvio(cents, paleta) {
    const desvio = Math.abs(cents);
    if (desvio <= TOLERANCIA_CENTS_AFINADO) return paleta.afinado;
    if (desvio <= TOLERANCIA_CENTS_AMPLIA) return paleta.cerca;
    return paleta.lejos;
  }

  function yDeMidi(midi, alto) {
    return alto / 2 - ((midi - centro) / amplitud) * alto;
  }

  function dibujar() {
    const { contexto, ancho, alto } = ajustarCanvas(canvas);
    const paleta = colores();
    contexto.clearRect(0, 0, ancho, alto);

    contexto.strokeStyle = paleta.cuadricula;
    contexto.lineWidth = 1;
    const desde = Math.ceil(centro - amplitud / 2);
    const hasta = Math.floor(centro + amplitud / 2);
    const altoFila = alto / amplitud;
    for (let midi = desde; midi <= hasta; midi++) {
      const y = yDeMidi(midi, alto);
      contexto.beginPath();
      contexto.moveTo(0, y);
      contexto.lineTo(ancho, y);
      contexto.stroke();
    }

    if (objetivo !== null) {
      const y = yDeMidi(objetivo, alto);
      const altoBanda = (ALTO_BANDA_RELATIVO / amplitud) * alto * 2;
      contexto.fillStyle = paleta.banda;
      contexto.fillRect(0, y - altoBanda / 2, ancho, altoBanda);
      contexto.strokeStyle = paleta.objetivo;
      contexto.lineWidth = GROSOR_OBJETIVO;
      contexto.beginPath();
      contexto.moveTo(0, y);
      contexto.lineTo(ancho, y);
      contexto.stroke();
    }

    contexto.fillStyle = paleta.texto;
    contexto.font = '12px system-ui, sans-serif';
    contexto.textBaseline = 'middle';
    for (let midi = desde; midi <= hasta; midi++) {
      if (!mereceEtiqueta(midi, altoFila)) continue;
      const y = yDeMidi(midi, alto) - Math.min(8, altoFila / 2);
      if (y < ALTO_MINIMO_ETIQUETA) continue;
      contexto.fillText(nombreNota(midi), 6, y);
    }

    const ahora = performance.now() / 1000;
    const xActual = ancho * 0.72;
    const pixelesPorSegundo = xActual / VENTANA_SEGUNDOS;
    estela.forEach((muestra, indice) => {
      const x = xActual - (ahora - muestra.tiempo) * pixelesPorSegundo;
      if (x < -RADIO_PUNTO) return;
      const y = yDeMidi(muestra.midi, alto);
      const cents = objetivo === null ? 0 : (muestra.midi - objetivo) * 100;
      contexto.fillStyle = objetivo === null ? paleta.objetivo : colorPorDesvio(cents, paleta);
      const esUltima = indice === estela.length - 1 && ahora - muestra.tiempo < 0.15;
      contexto.beginPath();
      contexto.arc(x, y, esUltima ? RADIO_PUNTO_ACTUAL : RADIO_PUNTO, 0, Math.PI * 2);
      contexto.fill();
    });
  }

  function purgar() {
    const limite = performance.now() / 1000 - VENTANA_SEGUNDOS;
    while (estela.length && estela[0].tiempo < limite) estela.shift();
  }

  return {
    elemento,
    fijarObjetivo(midi) {
      objetivo = midi;
      if (midi !== null) centro = midi;
      dibujar();
    },
    fijarCentro(midi, nuevaAmplitud = amplitud) {
      centro = midi;
      amplitud = nuevaAmplitud;
      dibujar();
    },
    registrar(midi) {
      estela.push({ tiempo: performance.now() / 1000, midi });
      purgar();
      dibujar();
    },
    redibujar() {
      purgar();
      dibujar();
    },
    limpiar() {
      estela.length = 0;
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
