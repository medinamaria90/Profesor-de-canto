// Ejercicio: escuchar una nota (o un intervalo) y sostener la nota objetivo.

import { el } from '../ui/dom.js';
import { nombreNota, CENTS_POR_SEMITONO } from '../musica/notas.js';
import { crearAfinadorVisual } from '../ui/componentes/afinador-visual.js';
import { crearBarraProgreso } from '../ui/componentes/barra-progreso.js';
import { puntuarMuestrasTolerante } from './puntuacion.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, reproducirGuia, capturarTrasVoz } from './comun.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.nota;

export function crearChipNota(midi) {
  const nombre = nombreNota(midi, false);
  const octava = nombreNota(midi).slice(nombre.length);
  return el(
    'div',
    { clase: 'nota-objetivo', 'aria-label': nombreNota(midi) },
    el('span', { clase: 'nota-objetivo__nombre', texto: nombre, 'aria-hidden': 'true' }),
    el('span', { clase: 'nota-objetivo__octava', texto: octava, 'aria-hidden': 'true' }),
  );
}

export function crearEjercicioNota(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const esIntervalo = ejercicio.escuchar.length > 1;
  const cabecera = crearCabeceraEjercicio(T.titulo, esIntervalo ? T.instruccionIntervalo : T.instruccion(nombreNota(ejercicio.midi)));
  const visual = crearAfinadorVisual({ midiObjetivo: ejercicio.midi, etiqueta: T.titulo });
  const barra = crearBarraProgreso({ valor: 0, maximo: 1, etiqueta: T.sostener, variante: 'captura' });
  const estado = crearEstadoEjercicio();
  contenedor.append(cabecera.elemento, crearChipNota(ejercicio.midi), visual.elemento, barra.elemento, estado);

  let captura = null;
  let destruido = false;

  async function faseEscuchar() {
    fijarAcciones([]);
    estado.textContent = `${TEXTOS.leccion.escuchar}…`;
    await reproducirGuia(ejercicio.escuchar);
    if (!destruido) faseCantar();
  }

  function faseCantar() {
    fijarAcciones([]);
    estado.textContent = TEXTOS.leccion.cantaAhora;
    visual.limpiar();
    barra.actualizar(0);
    contenedor.classList.add('ejercicio--grabando');
    captura = capturarTrasVoz({
      duracion: ejercicio.duracion,
      alInicio: () => {
        estado.textContent = T.sostener;
      },
      alMuestra: (midi) => visual.registrar(midi),
      alProgreso: (progreso) => barra.actualizar(progreso),
    });
    captura.promesa.then((resultado) => {
      contenedor.classList.remove('ejercicio--grabando');
      if (destruido || resultado.cancelado) return;
      if (!resultado.iniciado) {
        estado.textContent = TEXTOS.leccion.noTeOimos;
        fijarAcciones([
          { texto: TEXTOS.leccion.reintentar, accion: faseCantar },
          { texto: TEXTOS.leccion.saltar, variante: 'texto', accion: () => alTerminar({ puntuacion: 0 }) },
        ]);
        return;
      }
      estado.textContent = '';
      const cents = resultado.muestras.map((muestra) => (muestra.midi - ejercicio.midi) * CENTS_POR_SEMITONO);
      const puntuacion = puntuarMuestrasTolerante(cents);
      alTerminar({
        puntuacion: puntuacion.puntuacion,
        detalle: TEXTOS.leccion.precisionFormato(puntuacion.porcentajeAfinado),
        errorMedio: puntuacion.errorMedio,
      });
    });
  }

  return {
    iniciar() {
      visual.montar();
      faseEscuchar();
    },
    pausar() {
      captura?.cancelar();
      fijarAcciones([]);
    },
    reanudar() {
      faseCantar();
    },
    destruir() {
      destruido = true;
      captura?.cancelar();
      visual.destruir();
    },
  };
}
