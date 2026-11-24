// Hoja deslizante (panel desde abajo) para contenido largo que no cabe en una pantalla.

import { el } from '../dom.js';
import { crearBotonIcono } from './boton.js';
import { icono } from './iconos.js';
import { TEXTOS } from '../../contenido/textos.js';

export function mostrarHoja({ titulo, contenido }) {
  const capa = document.getElementById('capa-modal') ?? document.body;
  let cerrada = false;
  const cerrar = () => {
    if (cerrada) return;
    cerrada = true;
    hoja.close();
    hoja.remove();
  };
  const hoja = el(
    'dialog',
    { clase: 'hoja', 'aria-labelledby': 'hoja-titulo', onCancel: (evento) => { evento.preventDefault(); cerrar(); }, onClick: (evento) => { if (evento.target === hoja) cerrar(); } },
    el(
      'div',
      { clase: 'hoja__contenido' },
      el('header', { clase: 'hoja__cabecera' }, el('h2', { clase: 'hoja__titulo', id: 'hoja-titulo', texto: titulo }), crearBotonIcono(icono('cerrar'), { ariaLabel: TEXTOS.perfil.cancelar, onClick: cerrar })),
      el('div', { clase: 'hoja__cuerpo' }, contenido),
    ),
  );
  capa.append(hoja);
  hoja.showModal();
  return { cerrar };
}
