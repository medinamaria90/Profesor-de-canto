// Ejercicio sin micrófono: respiración guiada con un círculo que crece y decrece.

import { el, esperar } from '../ui/dom.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.respiracion;
const ORDEN_FASES = ['inhalar', 'retener', 'exhalar'];
const MS_POR_SEGUNDO = 1000;

export function crearEjercicioRespiracion(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, T.instruccion);
  const etiquetaFase = el('span', { clase: 'respiracion__fase' });
  const cuenta = el('span', { clase: 'respiracion__cuenta' });
  const circulo = el('div', { clase: 'respiracion__circulo', 'aria-hidden': 'true' }, etiquetaFase, cuenta);
  const estado = crearEstadoEjercicio();
  contenedor.append(cabecera.elemento, el('div', { clase: 'respiracion' }, circulo), estado);

  let cancelado = false;

  async function ejecutarFase(fase) {
    const segundos = ejercicio.fases[fase];
    circulo.style.setProperty('--duracion-fase', `${segundos}s`);
    circulo.dataset.fase = fase;
    etiquetaFase.textContent = T[fase];
    for (let restante = segundos; restante > 0; restante--) {
      if (cancelado) return;
      cuenta.textContent = String(restante);
      estado.textContent = `${T[fase]} · ${restante}`;
      await esperar(MS_POR_SEGUNDO);
    }
  }

  async function comenzar() {
    fijarAcciones([]);
    for (let ciclo = 1; ciclo <= ejercicio.ciclos; ciclo++) {
      cabecera.fijarInstruccion(T.cicloFormato(ciclo, ejercicio.ciclos));
      for (const fase of ORDEN_FASES) {
        await ejecutarFase(fase);
        if (cancelado) return;
      }
    }
    circulo.dataset.fase = 'fin';
    etiquetaFase.textContent = '';
    cuenta.textContent = '';
    estado.textContent = '';
    alTerminar({ puntuacion: PUNTUACION_MAXIMA, titulo: T.completada });
  }

  return {
    iniciar() {
      circulo.dataset.fase = 'reposo';
      fijarAcciones([{ texto: TEXTOS.leccion.empezar, accion: comenzar }]);
    },
    destruir() {
      cancelado = true;
    },
  };
}
