import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { TEXTOS } from '../../contenido/textos.js';
import { navegar } from '../../nucleo/router.js';

export function crearPantallaNoEncontrada() {
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-vacia' },
    el('p', { clase: 'pantalla-vacia__texto', texto: TEXTOS.errores.rutaNoEncontrada }),
    crearBoton(TEXTOS.errores.volverInicio, { onClick: () => navegar('/') }),
  );
  return { elemento };
}
