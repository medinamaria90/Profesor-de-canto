// Gráfico de barras horizontales: una barra por medición del rango vocal, de la nota grave a la aguda.

import { el, svg } from '../dom.js';
import { nombreNota } from '../../musica/notas.js';

const ANCHO = 320;
const ALTO_FILA = 26;
const MARGEN_IZQUIERDO = 52;
const MARGEN_DERECHO = 44;
const ALTO_BARRA = 12;
const MARGEN_SEMITONOS = 1;

function fechaCorta(clave) {
  const [, mes, dia] = clave.split('-');
  return `${dia}/${mes}`;
}

export function crearGraficoRango(historial, etiqueta) {
  const minimoGlobal = Math.min(...historial.map((m) => m.minimo)) - MARGEN_SEMITONOS;
  const maximoGlobal = Math.max(...historial.map((m) => m.maximo)) + MARGEN_SEMITONOS;
  const anchoUtil = ANCHO - MARGEN_IZQUIERDO - MARGEN_DERECHO;
  const xDeMidi = (midi) => MARGEN_IZQUIERDO + ((midi - minimoGlobal) / (maximoGlobal - minimoGlobal)) * anchoUtil;
  const alto = historial.length * ALTO_FILA + 8;
  const filas = historial.map((medida, indice) => {
    const y = 4 + indice * ALTO_FILA;
    const esUltima = indice === historial.length - 1;
    return svg(
      'g',
      { class: `grafico-rango__fila ${esUltima ? 'grafico-rango__fila--ultima' : ''}`.trim() },
      svg('text', { x: 0, y: y + ALTO_BARRA, class: 'grafico-rango__fecha' }, fechaCorta(medida.fecha)),
      svg('rect', { x: xDeMidi(medida.minimo), y, width: Math.max(4, xDeMidi(medida.maximo) - xDeMidi(medida.minimo)), height: ALTO_BARRA, rx: ALTO_BARRA / 2, class: 'grafico-rango__barra' }),
      svg('text', { x: ANCHO, y: y + ALTO_BARRA, 'text-anchor': 'end', class: 'grafico-rango__semitonos' }, `${medida.maximo - medida.minimo} st`),
    );
  });
  const ejes = svg(
    'g',
    { class: 'grafico-rango__ejes' },
    svg('text', { x: MARGEN_IZQUIERDO, y: alto + 12, class: 'grafico-rango__eje' }, nombreNota(minimoGlobal + MARGEN_SEMITONOS)),
    svg('text', { x: ANCHO - MARGEN_DERECHO, y: alto + 12, 'text-anchor': 'end', class: 'grafico-rango__eje' }, nombreNota(maximoGlobal - MARGEN_SEMITONOS)),
  );
  const grafico = svg('svg', { viewBox: `0 0 ${ANCHO} ${alto + 18}`, class: 'grafico-rango', role: 'img', 'aria-label': etiqueta }, filas, ejes);
  return el('div', { clase: 'grafico-rango__marco' }, grafico);
}
