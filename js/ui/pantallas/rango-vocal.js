// Medición libre del rango vocal: cantas a tu aire y la app apunta la nota más grave y la más aguda
// que mantienes un momento. Guardas cuando quieras.

import { el } from '../dom.js';
import { crearBoton, crearBotonIcono } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { crearAfinadorVisual } from '../componentes/afinador-visual.js';
import { crearSolicitudMicrofono } from '../componentes/solicitud-microfono.js';
import { nombreNota, CENTS_POR_SEMITONO } from '../../musica/notas.js';
import { TOLERANCIA_CENTS_AFINADO } from '../../ejercicios/puntuacion.js';
import { TEXTOS } from '../../contenido/textos.js';
import { actualizarEstado } from '../../estado/tienda.js';
import { fechaClave, guardarRangoVocal, AMPLITUD_MINIMA_RANGO } from '../../estado/progreso.js';
import { evaluarLogros } from '../../contenido/logros.js';
import { guardarAvisosPendientes } from '../../estado/sesion.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.bienvenida;
const MIDI_CENTRO_VISUAL = 57;
const AMPLITUD_VISUAL_SEMITONOS = 30;
// Una nota cuenta cuando se mantiene estable este tiempo: evita apuntar deslices y gallos.
const MS_NOTA_ESTABLE = 400;

export function crearPantallaRangoVocal({ consulta }) {
  const volverA = consulta.get('volver') || '/';
  const instruccion = el('h1', { clase: 'pantalla__titulo', texto: T.rangoTitulo });
  const explicacion = el('p', { clase: 'pantalla__subtitulo', texto: T.rangoLibre });
  const chipGrave = el('span', { clase: 'chip', texto: T.rangoGraveFormato('–') });
  const chipAgudo = el('span', { clase: 'chip', texto: T.rangoAgudoFormato('–') });
  const estado = el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite', texto: T.rangoEsperando });
  const visual = crearAfinadorVisual({ midiObjetivo: null, amplitudSemitonos: AMPLITUD_VISUAL_SEMITONOS, etiqueta: T.rangoTitulo });
  visual.fijarCentro(MIDI_CENTRO_VISUAL, AMPLITUD_VISUAL_SEMITONOS);
  const botonGuardar = crearBoton(T.guardarRango, { ancho: true, deshabilitado: true, onClick: guardar });
  const botonReiniciar = crearBoton(T.empezarDeNuevo, { variante: 'texto', ancho: true, onClick: reiniciar });
  const area = el('div', { clase: 'rango__area' });
  const elemento = el('section', { clase: 'pantalla pantalla-rango' }, area);

  let lector = null;
  let minimo = null;
  let maximo = null;
  let notaEstable = null;
  let desdeCuando = 0;

  function salir() {
    navegar(volverA, { reemplazar: true });
  }

  function pintarRango() {
    chipGrave.textContent = T.rangoGraveFormato(minimo === null ? '–' : nombreNota(minimo));
    chipAgudo.textContent = T.rangoAgudoFormato(maximo === null ? '–' : nombreNota(maximo));
    const listo = minimo !== null && maximo - minimo >= AMPLITUD_MINIMA_RANGO;
    botonGuardar.disabled = !listo;
    estado.textContent = listo ? T.rangoListo(nombreNota(minimo), nombreNota(maximo)) : minimo === null ? T.rangoEsperando : T.rangoSigue(AMPLITUD_MINIMA_RANGO);
  }

  function anotarNota(midi) {
    const redondeada = Math.round(midi);
    if (minimo === null || redondeada < minimo) minimo = redondeada;
    if (maximo === null || redondeada > maximo) maximo = redondeada;
    pintarRango();
  }

  function alLeer(lectura) {
    if (!lectura.voz) {
      notaEstable = null;
      visual.redibujar();
      return;
    }
    visual.registrar(lectura.midi);
    const ahora = performance.now();
    const desvio = notaEstable === null ? Infinity : Math.abs(lectura.midi - notaEstable) * CENTS_POR_SEMITONO;
    if (desvio > TOLERANCIA_CENTS_AFINADO) {
      notaEstable = lectura.midi;
      desdeCuando = ahora;
      return;
    }
    if (ahora - desdeCuando >= MS_NOTA_ESTABLE) anotarNota(notaEstable);
  }

  function reiniciar() {
    minimo = null;
    maximo = null;
    notaEstable = null;
    visual.limpiar();
    pintarRango();
  }

  function guardar() {
    const grave = minimo;
    const agudo = maximo;
    let logrosNuevos = [];
    actualizarEstado((actual) => {
      const evaluacion = evaluarLogros(guardarRangoVocal(actual, grave, agudo), fechaClave());
      logrosNuevos = evaluacion.nuevos;
      return evaluacion.estado;
    });
    guardarAvisosPendientes(logrosNuevos.map((logro) => `${TEXTOS.resultados.logroNuevo}: ${logro.icono} ${logro.titulo}`));
    salir();
  }

  function arrancar() {
    const botonSalir = crearBotonIcono(icono('cerrar'), { ariaLabel: TEXTOS.perfil.cancelar, onClick: salir });
    area.replaceChildren(
      el('header', { clase: 'pantalla__cabecera rango__cabecera' }, el('div', {}, instruccion, explicacion), botonSalir),
      el('div', { clase: 'rango__chips' }, chipGrave, chipAgudo),
      visual.elemento,
      estado,
      el('div', { clase: 'rango__acciones' }, botonGuardar, botonReiniciar),
    );
    visual.montar();
    pintarRango();
    lector = audio.crearLector(alLeer);
    lector.iniciar();
  }

  function mostrarSolicitud() {
    area.replaceChildren(crearSolicitudMicrofono({ alListo: arrancar, alOmitir: salir, textoOmitir: T.saltarRango }).elemento);
  }

  return {
    elemento,
    montado() {
      audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
      if (audio.tieneEntrada()) arrancar();
      else if (audio.permisoConcedido()) audio.abrirEntrada().then(arrancar).catch(mostrarSolicitud);
      else mostrarSolicitud();
    },
    destruir() {
      lector?.detener();
      visual.destruir();
      audio.cerrarEntrada();
    },
  };
}
