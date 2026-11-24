// Medición del rango vocal: la nota más grave y la más aguda cómodas.

import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { crearAfinadorVisual } from '../componentes/afinador-visual.js';
import { crearBarraProgreso } from '../componentes/barra-progreso.js';
import { crearSolicitudMicrofono } from '../componentes/solicitud-microfono.js';
import { capturarTrasVoz } from '../../ejercicios/comun.js';
import { nombreNota } from '../../musica/notas.js';
import { TEXTOS } from '../../contenido/textos.js';
import { actualizarEstado } from '../../estado/tienda.js';
import { fechaClave, guardarRangoVocal } from '../../estado/progreso.js';
import { evaluarLogros } from '../../contenido/logros.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.bienvenida;
const DURACION_CAPTURA_SEGUNDOS = 2.5;
const MIDI_CENTRO_VISUAL = 57;
const AMPLITUD_VISUAL_SEMITONOS = 30;
// Se toman percentiles para ignorar los deslices al empezar o terminar la nota.
const PERCENTIL_GRAVE = 0.15;
const PERCENTIL_AGUDO = 0.85;

function percentil(valores, fraccion) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.floor(fraccion * ordenados.length))];
}

export function crearPantallaRangoVocal({ consulta }) {
  const volverA = consulta.get('volver') || '/';
  const instruccion = el('h1', { clase: 'pantalla__titulo', texto: T.rangoGrave });
  const estado = el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite' });
  const visual = crearAfinadorVisual({ midiObjetivo: null, amplitudSemitonos: AMPLITUD_VISUAL_SEMITONOS, etiqueta: T.rangoTitulo });
  visual.fijarCentro(MIDI_CENTRO_VISUAL, AMPLITUD_VISUAL_SEMITONOS);
  const barra = crearBarraProgreso({ valor: 0, maximo: 1, etiqueta: T.rangoTitulo, variante: 'captura' });
  const acciones = el('div', { clase: 'rango__acciones' });
  const area = el('div', { clase: 'rango__area' });
  const elemento = el('section', { clase: 'pantalla pantalla-rango' }, area);

  let captura = null;
  let grave = null;

  function salir() {
    navegar(volverA, { reemplazar: true });
  }

  function medir(alResultado) {
    acciones.replaceChildren();
    estado.textContent = TEXTOS.leccion.cantaAhora;
    visual.limpiar();
    barra.actualizar(0);
    captura = capturarTrasVoz({
      duracion: DURACION_CAPTURA_SEGUNDOS,
      alInicio: () => {
        estado.textContent = TEXTOS.ejercicios.nota.sostener;
      },
      alMuestra: (midi) => visual.registrar(midi),
      alProgreso: (progreso) => barra.actualizar(progreso),
    });
    captura.promesa.then((resultado) => {
      if (resultado.cancelado) return;
      if (!resultado.iniciado) {
        estado.textContent = TEXTOS.leccion.noTeOimos;
        acciones.replaceChildren(
          crearBoton(TEXTOS.leccion.reintentar, { ancho: true, onClick: () => medir(alResultado) }),
          crearBoton(T.saltarRango, { variante: 'texto', ancho: true, onClick: salir }),
        );
        return;
      }
      alResultado(resultado.muestras.map((muestra) => muestra.midi));
    });
  }

  function medirGrave() {
    instruccion.textContent = T.rangoGrave;
    medir((midis) => {
      grave = Math.round(percentil(midis, PERCENTIL_GRAVE));
      medirAgudo();
    });
  }

  function medirAgudo() {
    instruccion.textContent = T.rangoAgudo;
    medir((midis) => {
      const agudo = Math.max(grave + 1, Math.round(percentil(midis, PERCENTIL_AGUDO)));
      mostrarResumen(grave, agudo);
    });
  }

  function mostrarResumen(minimo, maximo) {
    instruccion.textContent = T.rangoTitulo;
    estado.textContent = T.rangoListo(nombreNota(minimo), nombreNota(maximo));
    acciones.replaceChildren(
      crearBoton(T.empezar, {
        ancho: true,
        onClick: () => {
          actualizarEstado((actual) => evaluarLogros(guardarRangoVocal(actual, minimo, maximo), fechaClave()).estado);
          salir();
        },
      }),
      crearBoton(TEXTOS.perfil.medirOtraVez, { variante: 'texto', ancho: true, onClick: medirGrave }),
    );
  }

  function arrancar() {
    area.replaceChildren(el('header', { clase: 'pantalla__cabecera' }, instruccion), visual.elemento, barra.elemento, estado, acciones);
    visual.montar();
    medirGrave();
  }

  return {
    elemento,
    montado() {
      audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
      if (audio.tieneEntrada()) arrancar();
      else area.replaceChildren(crearSolicitudMicrofono({ alListo: arrancar, alOmitir: salir, textoOmitir: T.saltarRango }).elemento);
    },
    destruir() {
      captura?.cancelar();
      visual.destruir();
    },
  };
}
