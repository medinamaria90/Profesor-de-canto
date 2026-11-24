// Pantalla de lección: encadena los ejercicios, muestra el feedback de cada uno y registra el resultado.

import { el } from '../dom.js';
import { crearBoton, crearBotonIcono } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { crearBarraProgreso } from '../componentes/barra-progreso.js';
import { mostrarDialogo } from '../componentes/dialogo.js';
import { crearSolicitudMicrofono } from '../componentes/solicitud-microfono.js';
import { crearEjercicio } from '../../ejercicios/indice.js';
import { elegirAleatorio } from '../../ejercicios/comun.js';
import { calcularEstrellas, calificarResultado, puntuarMelodia, TOLERANCIA_CENTS_AFINADO } from '../../ejercicios/puntuacion.js';
import { instanciarEjercicios, requiereMicrofono } from '../../contenido/ejercicios.js';
import { obtenerLeccion, RUTINA_DIARIA } from '../../contenido/curriculum.js';
import { evaluarLogros } from '../../contenido/logros.js';
import { TEXTOS } from '../../contenido/textos.js';
import { obtenerEstado, actualizarEstado } from '../../estado/tienda.js';
import { guardarResultadoLeccion } from '../../estado/sesion.js';
import { leerLeccionEnCurso, guardarLeccionEnCurso, borrarLeccionEnCurso } from '../../estado/leccion-en-curso.js';
import { mostrarAviso } from '../componentes/aviso.js';
import {
  fechaClave,
  rangoVocalEfectivo,
  calcularXpLeccion,
  registrarLeccion,
  registrarRutina,
  registrarActividad,
  habilidadOido,
  oidoDominado,
  XP_RUTINA_DIARIA,
  UMBRAL_LECCION_PERFECTA,
} from '../../estado/progreso.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';
import { crearPantallaNoEncontrada } from './no-encontrada.js';

const T = TEXTOS.leccion;
// A partir de esta desviación media se da un consejo de "cantas alto/bajo".
const CENTS_PARA_CONSEJO = TOLERANCIA_CENTS_AFINADO * 0.6;
// Sin micrófono la lección vale la mitad de XP y no cuenta para el camino.
const FACTOR_XP_PRACTICA = 0.5;

export function crearPantallaLeccion({ id }) {
  const leccion = obtenerLeccion(id);
  if (!leccion) return crearPantallaNoEncontrada();

  const esRutina = leccion.id === RUTINA_DIARIA.id;
  const enCurso = leerLeccionEnCurso(leccion.id);
  let ejercicios = enCurso?.ejercicios ?? instanciarEjercicios(leccion.ejercicios, rangoVocalEfectivo(obtenerEstado()), {
    nivelOido: habilidadOido(obtenerEstado()).nivel,
    oidoDominado: oidoDominado(obtenerEstado()),
  });
  const puntuaciones = enCurso?.puntuaciones ?? [];
  let indice = enCurso?.indice ?? 0;
  let ejercicioActual = null;
  let modoPractica = enCurso?.modoPractica ?? false;
  let destruida = false;

  function recordarProgreso() {
    guardarLeccionEnCurso({ leccionId: leccion.id, ejercicios, puntuaciones, indice, modoPractica });
  }

  const barra = crearBarraProgreso({ valor: 0, maximo: ejercicios.length, etiqueta: T.progresoFormato(1, ejercicios.length) });
  const botonCerrar = crearBotonIcono(icono('cerrar'), { ariaLabel: T.salir, onClick: confirmarSalida });
  const area = el('div', { clase: 'leccion__area' });
  const pie = el('div', { clase: 'leccion__pie leccion__pie--vacio' });
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-leccion', 'aria-label': leccion.titulo },
    el('header', { clase: 'leccion__cabecera' }, botonCerrar, barra.elemento),
    area,
    pie,
  );

  function fijarAcciones(acciones) {
    pie.className = 'leccion__pie';
    pie.classList.toggle('leccion__pie--vacio', acciones.length === 0);
    pie.replaceChildren(...acciones.map((accion) => crearBoton(accion.texto, { variante: accion.variante ?? 'relleno', ancho: true, onClick: accion.accion })));
  }

  function mostrarEjercicio() {
    ejercicioActual?.destruir();
    audio.detenerTodo();
    const ejercicio = ejercicios[indice];
    barra.actualizar(indice);
    barra.elemento.setAttribute('aria-label', T.progresoFormato(indice + 1, ejercicios.length));
    const contenedor = el('div', { clase: `ejercicio ejercicio--${ejercicio.tipo}` });
    area.replaceChildren(contenedor);
    fijarAcciones([]);
    ejercicioActual = crearEjercicio(ejercicio, { contenedor, fijarAcciones, alTerminar: mostrarFeedback });
    ejercicioActual.iniciar();
  }

  function mostrarFeedback(resultado) {
    puntuaciones.push(resultado.puntuacion);
    const calificacion = calificarResultado(resultado.puntuacion);
    const titulo = resultado.titulo ?? elegirAleatorio(T.resultados[calificacion]);
    let consejo = null;
    if (resultado.errorMedio !== null && resultado.errorMedio !== undefined && Math.abs(resultado.errorMedio) >= CENTS_PARA_CONSEJO) {
      consejo = resultado.errorMedio > 0 ? T.desvioAgudo : T.desvioGrave;
    }
    const botonContinuar = crearBoton(T.continuar, { ancho: true, onClick: siguiente });
    pie.className = `leccion__pie leccion__pie--feedback leccion__pie--${calificacion}`;
    pie.replaceChildren(
      el(
        'div',
        { clase: 'leccion__feedback', role: 'status' },
        el('p', { clase: 'leccion__feedback-titulo', texto: titulo }),
        resultado.detalle && el('p', { clase: 'leccion__feedback-detalle', texto: resultado.detalle }),
        consejo && el('p', { clase: 'leccion__feedback-consejo', texto: consejo }),
      ),
      botonContinuar,
    );
    botonContinuar.focus();
  }

  function siguiente() {
    indice++;
    if (indice >= ejercicios.length) {
      terminarLeccion();
      return;
    }
    recordarProgreso();
    mostrarEjercicio();
  }

  function terminarLeccion() {
    ejercicioActual?.destruir();
    ejercicioActual = null;
    borrarLeccionEnCurso();
    const puntuacion = puntuarMelodia(puntuaciones);
    const estrellas = calcularEstrellas(puntuacion);
    const hoy = fechaClave();
    const xpCompleto = esRutina ? XP_RUTINA_DIARIA : calcularXpLeccion(puntuaciones, { conBonus: !modoPractica });
    const xp = modoPractica ? Math.round(xpCompleto * FACTOR_XP_PRACTICA) : xpCompleto;
    let logrosNuevos = [];
    const estadoFinal = actualizarEstado((estado) => {
      let conRegistro;
      if (modoPractica) conRegistro = registrarActividad(estado, xp, hoy);
      else if (esRutina) conRegistro = registrarRutina(estado, puntuacion, hoy);
      else conRegistro = registrarLeccion(estado, { leccionId: leccion.id, puntuacion, estrellas, xp, hoy });
      const evaluacion = evaluarLogros(conRegistro, hoy);
      logrosNuevos = evaluacion.nuevos;
      return evaluacion.estado;
    });
    guardarResultadoLeccion({
      leccionId: leccion.id,
      titulo: leccion.titulo,
      esRutina,
      modoPractica,
      puntuacion,
      estrellas: modoPractica ? 0 : estrellas,
      xp,
      bonus: !esRutina && !modoPractica && puntuacion >= UMBRAL_LECCION_PERFECTA,
      logros: logrosNuevos,
      racha: estadoFinal.racha,
      xpHoy: estadoFinal.xpPorDia[hoy] ?? 0,
      objetivoDiarioXp: estadoFinal.objetivoDiarioXp,
    });
    navegar('/resultados', { reemplazar: true });
  }

  async function confirmarSalida() {
    ejercicioActual?.pausar?.();
    audio.detenerTodo();
    const salir = await mostrarDialogo({ titulo: T.confirmarSalirTitulo, texto: T.confirmarSalirTexto, confirmar: T.confirmarSalirSi, cancelar: T.confirmarSalirNo, peligro: true });
    if (!salir) {
      ejercicioActual?.reanudar?.();
      return;
    }
    borrarLeccionEnCurso();
    navegar('/', { reemplazar: true });
  }

  function seguirSinMicrofono() {
    ejercicios = ejercicios.filter((ejercicio) => !requiereMicrofono(ejercicio));
    if (ejercicios.length === 0) {
      navegar('/', { reemplazar: true });
      return;
    }
    modoPractica = true;
    recordarProgreso();
    barra.fijarMaximo(ejercicios.length);
    elemento.insertBefore(el('p', { clase: 'aviso', role: 'note', texto: T.modoPractica }), area);
    mostrarEjercicio();
  }

  async function prepararMicrofono() {
    if (audio.tieneEntrada()) {
      mostrarEjercicio();
      return;
    }
    const sinPreguntar = await audio.puedeAbrirSinPreguntar();
    if (destruida) return;
    if (sinPreguntar) {
      try {
        await audio.abrirEntrada();
        if (!destruida) mostrarEjercicio();
        return;
      } catch (error) {
        if (destruida || error.motivo === 'cancelado') return;
        console.warn('No se pudo reabrir el micrófono; se muestra la tarjeta de permiso.', error);
      }
    }
    area.replaceChildren(crearSolicitudMicrofono({ alListo: () => !destruida && mostrarEjercicio(), alOmitir: seguirSinMicrofono }).elemento);
  }

  function montado() {
    audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
    if (enCurso && indice > 0) {
      mostrarAviso(T.reanudada);
      if (modoPractica) elemento.insertBefore(el('p', { clase: 'aviso', role: 'note', texto: T.modoPractica }), area);
    }
    if (ejercicios.some(requiereMicrofono)) prepararMicrofono();
    else mostrarEjercicio();
  }

  return {
    elemento,
    montado,
    destruir() {
      destruida = true;
      ejercicioActual?.destruir();
      audio.detenerTodo();
      audio.cerrarEntrada();
    },
  };
}
