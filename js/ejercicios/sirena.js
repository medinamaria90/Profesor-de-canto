// Ejercicio: deslizar la voz de grave a agudo (calentamiento y amplitud).

import { crearAfinadorVisual } from '../ui/componentes/afinador-visual.js';
import { crearBarraProgreso } from '../ui/componentes/barra-progreso.js';
import { puntuarSirena } from './puntuacion.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, capturarTrasVoz } from './comun.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.sirena;
const AMPLITUD_VISUAL_SEMITONOS = 18;
// La sirena termina sola cuando el usuario deja de cantar este tiempo.
const MS_SILENCIO_PARA_TERMINAR = 800;

export function crearEjercicioSirena(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, T.instruccion);
  const centro = Math.round((ejercicio.rango.minimo + ejercicio.rango.maximo) / 2);
  const visual = crearAfinadorVisual({ midiObjetivo: null, amplitudSemitonos: AMPLITUD_VISUAL_SEMITONOS, etiqueta: T.titulo });
  visual.fijarCentro(centro, AMPLITUD_VISUAL_SEMITONOS);
  const barra = crearBarraProgreso({ valor: 0, maximo: 1, etiqueta: T.titulo, variante: 'captura' });
  const estado = crearEstadoEjercicio();
  contenedor.append(cabecera.elemento, visual.elemento, barra.elemento, estado);

  let captura = null;
  let destruido = false;

  function faseCantar() {
    fijarAcciones([]);
    estado.textContent = TEXTOS.leccion.cantaAhora;
    visual.limpiar();
    barra.actualizar(0);
    contenedor.classList.add('ejercicio--grabando');
    captura = capturarTrasVoz({
      duracion: ejercicio.duracion,
      silencioParaTerminar: MS_SILENCIO_PARA_TERMINAR,
      alInicio: () => {
        estado.textContent = T.enMarcha;
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
      const { puntuacion, amplitud, ascendente } = puntuarSirena(resultado.muestras.map((muestra) => muestra.midi));
      alTerminar({
        puntuacion,
        titulo: ascendente ? T.completada : T.sinSubir,
        detalle: T.amplitudFormato(Math.round(amplitud)),
      });
    });
  }

  return {
    iniciar() {
      visual.montar();
      faseCantar();
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
