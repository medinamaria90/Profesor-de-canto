import { el } from '../dom.js';

// variante: 'relleno' | 'tonal' | 'contorno' | 'texto' | 'peligro'
export function crearBoton(texto, { variante = 'relleno', icono = null, onClick, ancho = false, tipo = 'button', ariaLabel, deshabilitado = false } = {}) {
  return el(
    'button',
    {
      clase: `boton boton--${variante}${ancho ? ' boton--ancho' : ''}`,
      type: tipo,
      onClick,
      'aria-label': ariaLabel,
      disabled: deshabilitado,
    },
    icono && el('span', { clase: 'boton__icono', 'aria-hidden': 'true', texto: icono }),
    el('span', { clase: 'boton__texto', texto }),
  );
}

export function crearBotonIcono(svgIcono, { onClick, ariaLabel, variante = 'texto' } = {}) {
  return el('button', { clase: `boton-icono boton-icono--${variante}`, type: 'button', onClick, 'aria-label': ariaLabel }, svgIcono);
}
