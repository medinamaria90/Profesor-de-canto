// Aviso breve (snackbar) que aparece abajo y se va solo.

import { el } from '../dom.js';

const DURACION_POR_DEFECTO_MS = 3500;
const MS_SALIDA = 300;

export function mostrarAviso(texto, { duracionMs = DURACION_POR_DEFECTO_MS, retrasoMs = 0 } = {}) {
  const capa = document.getElementById('capa-modal') ?? document.body;
  const aviso = el('div', { clase: 'aviso-flotante', role: 'status', texto, hidden: true });
  capa.append(aviso);
  const mostrar = () => {
    aviso.hidden = false;
    setTimeout(() => {
      aviso.classList.add('aviso-flotante--saliendo');
      setTimeout(() => aviso.remove(), MS_SALIDA);
    }, duracionMs);
  };
  if (retrasoMs > 0) setTimeout(mostrar, retrasoMs);
  else mostrar();
}
