import { el, svg } from '../dom.js';

const TAMANO_POR_DEFECTO = 64;
const GROSOR_POR_DEFECTO = 7;

// Anillo circular de progreso con un contenido opcional en el centro.
export function crearAnilloProgreso({ valor = 0, maximo = 1, tamano = TAMANO_POR_DEFECTO, grosor = GROSOR_POR_DEFECTO, etiqueta, contenido = null }) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const pista = svg('circle', { class: 'anillo__pista', cx: tamano / 2, cy: tamano / 2, r: radio, 'stroke-width': grosor });
  const avance = svg('circle', {
    class: 'anillo__avance',
    cx: tamano / 2,
    cy: tamano / 2,
    r: radio,
    'stroke-width': grosor,
    'stroke-dasharray': circunferencia,
    'stroke-dashoffset': circunferencia,
    transform: `rotate(-90 ${tamano / 2} ${tamano / 2})`,
  });
  const grafico = svg('svg', { class: 'anillo__svg', viewBox: `0 0 ${tamano} ${tamano}`, width: tamano, height: tamano, 'aria-hidden': 'true' }, pista, avance);
  const elemento = el(
    'div',
    { clase: 'anillo', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': maximo, 'aria-valuenow': valor, 'aria-label': etiqueta, estilo: { width: `${tamano}px`, height: `${tamano}px` } },
    grafico,
    contenido && el('div', { clase: 'anillo__contenido' }, contenido),
  );

  function actualizar(nuevoValor) {
    const fraccion = maximo > 0 ? Math.min(1, Math.max(0, nuevoValor / maximo)) : 0;
    avance.setAttribute('stroke-dashoffset', circunferencia * (1 - fraccion));
    elemento.setAttribute('aria-valuenow', nuevoValor);
    elemento.classList.toggle('anillo--completo', fraccion >= 1);
  }
  actualizar(valor);
  return { elemento, actualizar };
}
