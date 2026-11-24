// Micro-lección de técnica vocal: qué quiere decir, cómo se hace, en qué se falla y, si es un sonido, un ejemplo
// que la app imita para copiarlo. Se lee, se prueba el gesto y se continúa.

import { el } from '../ui/dom.js';
import { crearBoton } from '../ui/componentes/boton.js';
import { crearCabeceraEjercicio } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { audio } from '../audio/servicio-audio.js';
import { guardarUltimoError } from '../estado/almacen.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.tecnica;
const MS_POR_SEGUNDO = 1000;

function seccion(titulo, contenido) {
  return el('section', { clase: 'tecnica__seccion' }, el('h3', { clase: 'tecnica__seccion-titulo', texto: titulo }), contenido);
}

export function crearEjercicioTecnica(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, ejercicio.titulo);
  const midiEjemplo = Math.round((ejercicio.rango.minimo + ejercicio.rango.maximo) / 2);
  let sonando = null;
  let temporizador = null;

  const botonEjemplo = ejercicio.ejemplo
    ? crearBoton(T.escuchar, { variante: 'tonal', icono: 'reproducir', ancho: true, onClick: alternarEjemplo })
    : null;

  function pararEjemplo() {
    clearTimeout(temporizador);
    temporizador = null;
    sonando?.detener();
    sonando = null;
    if (botonEjemplo) botonEjemplo.querySelector('.boton__texto').textContent = T.escuchar;
  }

  async function alternarEjemplo() {
    if (sonando) {
      pararEjemplo();
      return;
    }
    try {
      await audio.preparar();
      sonando = audio.reproducirEjemplo(ejercicio.ejemplo, midiEjemplo);
      botonEjemplo.querySelector('.boton__texto').textContent = T.parar;
      temporizador = setTimeout(pararEjemplo, sonando.duracion * MS_POR_SEGUNDO);
    } catch (error) {
      console.error('No se pudo reproducir el ejemplo.', error);
      guardarUltimoError(`Ejemplo ${ejercicio.ejemplo}: ${error.message}`);
    }
  }

  contenedor.append(
    cabecera.elemento,
    el(
      'article',
      { clase: 'tecnica tarjeta' },
      el('div', { clase: 'tecnica__icono', 'aria-hidden': 'true', texto: ejercicio.icono }),
      el('p', { clase: 'tecnica__resumen', texto: ejercicio.resumen }),
      seccion(T.queEs, el('p', { clase: 'tecnica__texto', texto: ejercicio.queEs })),
      botonEjemplo && el('div', { clase: 'tecnica__ejemplo' }, botonEjemplo),
      seccion(T.comoSeHace, el('ol', { clase: 'tecnica__pasos' }, ejercicio.pasos.map((paso) => el('li', { texto: paso })))),
      seccion(T.errores, el('ul', { clase: 'tecnica__errores' }, ejercicio.errores.map((error) => el('li', { texto: error })))),
      el('p', { clase: 'tecnica__consejo' }, el('strong', { texto: `${T.consejo}: ` }), ejercicio.consejo),
    ),
  );

  return {
    iniciar() {
      fijarAcciones([
        {
          texto: T.entendido,
          accion: () => {
            pararEjemplo();
            alTerminar({ puntuacion: PUNTUACION_MAXIMA, titulo: T.aprendida });
          },
        },
      ]);
    },
    destruir() {
      pararEjemplo();
    },
  };
}
