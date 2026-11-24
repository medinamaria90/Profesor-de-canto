// Micro-lección de técnica vocal: se lee, se prueba el gesto y se continúa.

import { el } from '../ui/dom.js';
import { crearCabeceraEjercicio } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.tecnica;

export function crearEjercicioTecnica(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, ejercicio.titulo);
  contenedor.append(
    cabecera.elemento,
    el(
      'article',
      { clase: 'tecnica tarjeta' },
      el('div', { clase: 'tecnica__icono', 'aria-hidden': 'true', texto: ejercicio.icono }),
      el('p', { clase: 'tecnica__resumen', texto: ejercicio.resumen }),
      el('ol', { clase: 'tecnica__pasos' }, ejercicio.pasos.map((paso) => el('li', { texto: paso }))),
      el('p', { clase: 'tecnica__consejo' }, el('strong', { texto: `${T.consejo}: ` }), ejercicio.consejo),
    ),
  );
  return {
    iniciar() {
      fijarAcciones([{ texto: T.entendido, accion: () => alTerminar({ puntuacion: PUNTUACION_MAXIMA, titulo: T.aprendida }) }]);
    },
    destruir() {},
  };
}
