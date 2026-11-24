import { el } from '../dom.js';
import { icono } from './iconos.js';
import { TEXTOS } from '../../contenido/textos.js';

const TOTAL_ESTRELLAS = 3;

export function crearEstrellas(conseguidas, { tamano = 'm', animadas = false } = {}) {
  const lista = [];
  for (let i = 0; i < TOTAL_ESTRELLAS; i++) {
    const llena = i < conseguidas;
    lista.push(
      el(
        'span',
        { clase: `estrellas__estrella ${llena ? 'estrellas__estrella--llena' : ''}`.trim(), estilo: animadas && llena ? { animationDelay: `${i * 180}ms` } : null },
        icono('estrella'),
      ),
    );
  }
  return el(
    'span',
    { clase: `estrellas estrellas--${tamano} ${animadas ? 'estrellas--animadas' : ''}`.trim(), role: 'img', 'aria-label': TEXTOS.inicio.estrellasFormato(conseguidas) },
    lista,
  );
}
