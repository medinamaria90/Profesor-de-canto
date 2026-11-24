import { el } from '../dom.js';
import { icono } from './iconos.js';

// Barra de navegación inferior. destinos: [{ camino, texto, icono }]
export function crearNavegacion(destinos) {
  const enlaces = destinos.map((destino) =>
    el(
      'a',
      { clase: 'navegacion__enlace', href: `#${destino.camino}`, datos: { camino: destino.camino } },
      el('span', { clase: 'navegacion__icono' }, icono(destino.icono)),
      el('span', { clase: 'navegacion__texto', texto: destino.texto }),
    ),
  );
  const elemento = el('div', { clase: 'navegacion' }, enlaces);

  function marcarActiva(camino) {
    for (const enlace of enlaces) {
      const activa = camino === enlace.dataset.camino || (enlace.dataset.camino !== '/' && camino.startsWith(enlace.dataset.camino));
      enlace.classList.toggle('navegacion__enlace--activa', activa);
      if (activa) enlace.setAttribute('aria-current', 'page');
      else enlace.removeAttribute('aria-current');
    }
  }

  function mostrar(visible) {
    elemento.hidden = !visible;
    document.body.classList.toggle('sin-navegacion', !visible);
  }

  return { elemento, marcarActiva, mostrar };
}
