// Perfil en una pantalla: lo esencial a la vista; logros, diagnóstico y ajustes detrás de un panel.

import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { mostrarDialogo } from '../componentes/dialogo.js';
import { mostrarHoja } from '../componentes/hoja.js';
import { crearSelectorObjetivo } from './bienvenida.js';
import { LOGROS } from '../../contenido/logros.js';
import { TEXTOS } from '../../contenido/textos.js';
import { obtenerEstado, actualizarEstado, reiniciarEstado } from '../../estado/tienda.js';
import { fechaClave, rachaVigente, totalEstrellas, mejoraDelRango, ultimoTestOido } from '../../estado/progreso.js';
import { crearGraficoRango } from '../componentes/grafico-rango.js';
import { nombreNota } from '../../musica/notas.js';
import { audio } from '../../audio/servicio-audio.js';
import { leerUltimoError } from '../../estado/almacen.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.perfil;
const TO = TEXTOS.testOido;

function crearEstadistica(etiqueta, valor) {
  return el('div', { clase: 'estadistica' }, el('p', { clase: 'estadistica__valor', texto: String(valor) }), el('p', { clase: 'estadistica__etiqueta', texto: etiqueta }));
}

// Fila compacta: título, dato en una línea y un botón a la derecha.
function crearFicha({ titulo, texto, boton, alPulsar }) {
  return el(
    'div',
    { clase: 'ficha tarjeta' },
    el('div', { clase: 'ficha__texto' }, el('p', { clase: 'ficha__titulo', texto: titulo }), el('p', { clase: 'ficha__detalle', texto })),
    crearBoton(boton, { variante: 'tonal', onClick: alPulsar }),
  );
}

function formatearSegundos(valor) {
  return valor === null || valor === undefined ? '–' : `${Math.round(valor * 1000)} ms`;
}

function crearLogro(logro, conseguido) {
  return el(
    'li',
    { clase: `logro ${conseguido ? '' : 'logro--bloqueado'}`.trim(), 'aria-label': `${logro.titulo}. ${logro.descripcion}${conseguido ? '' : `. ${T.bloqueado}`}` },
    el('span', { clase: 'logro__icono', 'aria-hidden': 'true', texto: logro.icono }),
    el('div', { clase: 'logro__texto' }, el('p', { clase: 'logro__titulo', texto: logro.titulo }), el('p', { clase: 'logro__descripcion', texto: logro.descripcion })),
  );
}

function abrirLogros(estado) {
  mostrarHoja({ titulo: T.logros, contenido: el('ul', { clase: 'logros' }, LOGROS.map((logro) => crearLogro(logro, Boolean(estado.logros[logro.id])))) });
}

function abrirRango(estado) {
  const historial = estado.historialRango ?? [];
  mostrarHoja({
    titulo: T.rangoTitulo,
    contenido: el(
      'div',
      { clase: 'hoja__pila' },
      historial.length > 0 ? crearGraficoRango(historial, T.evolucionRango) : el('p', { clase: 'perfil__texto', texto: T.rangoSinMedir }),
      historial.length > 1 && el('p', { clase: 'perfil__texto', texto: T.mejoraFormato(mejoraDelRango(estado)) }),
      crearBoton(estado.rangoVocal ? T.medirOtraVez : T.medirRango, { ancho: true, onClick: () => navegar('/rango?volver=/perfil') }),
    ),
  });
}

function abrirAjustes(estado) {
  const datos = audio.diagnostico();
  const ultimoError = leerUltimoError();
  const filas = [
    [T.diagnosticoLatenciaSalida, formatearSegundos(datos.latenciaSalida)],
    [T.diagnosticoLatenciaEntrada, formatearSegundos(datos.latenciaEntrada)],
    [T.diagnosticoLatenciaAprendida, formatearSegundos(datos.latenciaAprendida)],
    [T.diagnosticoFotogramas, datos.fotogramasPorSegundo ? String(datos.fotogramasPorSegundo) : '–'],
    [T.diagnosticoMuestreo, `${datos.frecuenciaMuestreo} Hz`],
    [T.diagnosticoUltimoError, ultimoError ? `${ultimoError.fecha.slice(11, 16)} · ${ultimoError.texto}` : '–'],
  ];
  const hoja = mostrarHoja({
    titulo: T.ajustes,
    contenido: el(
      'div',
      { clase: 'hoja__pila' },
      el('h3', { clase: 'perfil__subtitulo', texto: T.objetivo }),
      crearSelectorObjetivo(estado.objetivoDiarioXp, (xp) => actualizarEstado((actual) => ({ ...actual, objetivoDiarioXp: xp }))),
      el('h3', { clase: 'perfil__subtitulo', texto: T.diagnostico }),
      el('dl', { clase: 'diagnostico' }, filas.map(([etiqueta, valor]) => el('div', { clase: 'diagnostico__fila' }, el('dt', { texto: etiqueta }), el('dd', { texto: valor })))),
      audio.esSimulado && el('p', { clase: 'aviso', role: 'note', texto: T.simulacion }),
      crearBoton(T.reiniciar, {
        variante: 'peligro-texto',
        ancho: true,
        onClick: async () => {
          const borrar = await mostrarDialogo({ titulo: T.reiniciarTitulo, texto: T.reiniciarTexto, confirmar: T.reiniciarConfirmar, cancelar: T.cancelar, peligro: true });
          if (!borrar) return;
          hoja.cerrar();
          reiniciarEstado();
          navegar('/bienvenida', { reemplazar: true });
        },
      }),
    ),
  });
}

export function crearPantallaPerfil() {
  const estado = obtenerEstado();
  const hoy = fechaClave();
  const conseguidos = LOGROS.filter((logro) => estado.logros[logro.id]).length;
  const inicial = estado.nombre ? estado.nombre.charAt(0).toUpperCase() : null;
  const rango = estado.rangoVocal;
  const test = ultimoTestOido(estado);

  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-perfil' },
    el(
      'header',
      { clase: 'perfil__cabecera' },
      el('div', { clase: 'perfil__avatar', 'aria-hidden': 'true', texto: inicial }, inicial === null && icono('persona', { tamano: 32 })),
      el('h1', { clase: 'pantalla__titulo', texto: estado.nombre || T.titulo }),
      crearBoton(T.ajustes, { variante: 'texto', onClick: () => abrirAjustes(estado) }),
    ),
    el(
      'section',
      { clase: 'perfil__estadisticas', 'aria-label': T.estadisticas },
      crearEstadistica(T.xpTotal, estado.xpTotal),
      crearEstadistica(T.racha, rachaVigente(estado, hoy)),
      crearEstadistica(T.lecciones, Object.keys(estado.lecciones).length),
      crearEstadistica(T.estrellas, totalEstrellas(estado)),
    ),
    crearFicha({
      titulo: T.rangoTitulo,
      texto: rango ? T.rangoFormato(nombreNota(rango.minimo), nombreNota(rango.maximo), rango.maximo - rango.minimo) : T.rangoSinMedir,
      boton: rango ? T.ver : T.medirRango,
      alPulsar: () => (rango ? abrirRango(estado) : navegar('/rango?volver=/perfil')),
    }),
    crearFicha({
      titulo: TO.tarjetaTitulo,
      texto: test ? TO.tarjetaUltimo(test) : TO.tarjetaTexto,
      boton: test ? TO.repetirTest : TO.hacerTest,
      alPulsar: () => navegar('/test-oido'),
    }),
    crearFicha({
      titulo: T.logros,
      texto: T.logrosFormato(conseguidos, LOGROS.length),
      boton: T.ver,
      alPulsar: () => abrirLogros(estado),
    }),
  );
  return { elemento };
}
