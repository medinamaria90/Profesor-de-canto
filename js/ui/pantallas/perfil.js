// Perfil: estadísticas, rango vocal, objetivo diario, logros y borrado del progreso.

import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { mostrarDialogo } from '../componentes/dialogo.js';
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

function crearEstadistica(etiqueta, valor) {
  return el('div', { clase: 'estadistica' }, el('p', { clase: 'estadistica__valor', texto: String(valor) }), el('p', { clase: 'estadistica__etiqueta', texto: etiqueta }));
}

function crearTarjetaRango(estado) {
  const rango = estado.rangoVocal;
  const historial = estado.historialRango ?? [];
  const mejora = mejoraDelRango(estado);
  const texto = rango ? T.rangoFormato(nombreNota(rango.minimo), nombreNota(rango.maximo), rango.maximo - rango.minimo) : T.rangoSinMedir;
  return el(
    'section',
    { clase: 'tarjeta perfil__seccion', 'aria-labelledby': 'perfil-rango' },
    el('h2', { clase: 'perfil__subtitulo', id: 'perfil-rango', texto: T.rangoTitulo }),
    el('p', { clase: 'perfil__texto', texto }),
    historial.length > 0 && crearGraficoRango(historial, T.evolucionRango),
    historial.length > 1 && el('p', { clase: 'perfil__texto', texto: T.mejoraFormato(mejora) }),
    el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.rangoConsejo }),
    crearBoton(rango ? T.medirOtraVez : T.medirRango, { variante: 'tonal', onClick: () => navegar('/rango?volver=/perfil') }),
  );
}

function formatearSegundos(valor) {
  return valor === null || valor === undefined ? '–' : `${Math.round(valor * 1000)} ms`;
}

function crearTarjetaDiagnostico() {
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
  return el(
    'section',
    { clase: 'tarjeta perfil__seccion', 'aria-labelledby': 'perfil-diagnostico' },
    el('h2', { clase: 'perfil__subtitulo', id: 'perfil-diagnostico', texto: T.diagnostico }),
    el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.diagnosticoTexto }),
    el('dl', { clase: 'diagnostico' }, filas.map(([etiqueta, valor]) => el('div', { clase: 'diagnostico__fila' }, el('dt', { texto: etiqueta }), el('dd', { texto: valor })))),
  );
}

function crearTarjetaTestOido(estado) {
  const ultimo = ultimoTestOido(estado);
  const TO = TEXTOS.testOido;
  return el(
    'section',
    { clase: 'tarjeta perfil__seccion', 'aria-labelledby': 'perfil-test-oido' },
    el('h2', { clase: 'perfil__subtitulo', id: 'perfil-test-oido', texto: TO.tarjetaTitulo }),
    el('p', { clase: 'perfil__texto', texto: ultimo ? TO.tarjetaUltimo(ultimo.umbralCents, ultimo.aciertosAbsoluto, ultimo.totalAbsoluto, ultimo.fecha) : TO.tarjetaTexto }),
    crearBoton(ultimo ? TO.repetirTest : TO.hacerTest, { variante: 'tonal', onClick: () => navegar('/test-oido') }),
  );
}

function crearLogro(logro, conseguidoEl) {
  const conseguido = Boolean(conseguidoEl);
  return el(
    'li',
    { clase: `logro ${conseguido ? '' : 'logro--bloqueado'}`.trim(), 'aria-label': `${logro.titulo}. ${logro.descripcion}${conseguido ? '' : `. ${T.bloqueado}`}` },
    el('span', { clase: 'logro__icono', 'aria-hidden': 'true', texto: logro.icono }),
    el('div', { clase: 'logro__texto' }, el('p', { clase: 'logro__titulo', texto: logro.titulo }), el('p', { clase: 'logro__descripcion', texto: logro.descripcion })),
  );
}

export function crearPantallaPerfil() {
  const estado = obtenerEstado();
  const hoy = fechaClave();
  const conseguidos = LOGROS.filter((logro) => estado.logros[logro.id]).length;
  const inicial = estado.nombre ? estado.nombre.charAt(0).toUpperCase() : null;

  async function confirmarBorrado() {
    const borrar = await mostrarDialogo({ titulo: T.reiniciarTitulo, texto: T.reiniciarTexto, confirmar: T.reiniciarConfirmar, cancelar: T.cancelar, peligro: true });
    if (!borrar) return;
    reiniciarEstado();
    navegar('/bienvenida', { reemplazar: true });
  }

  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-perfil' },
    el(
      'header',
      { clase: 'perfil__cabecera' },
      el('div', { clase: 'perfil__avatar', 'aria-hidden': 'true', texto: inicial }, inicial === null && icono('persona', { tamano: 32 })),
      el('h1', { clase: 'pantalla__titulo', texto: estado.nombre || T.titulo }),
    ),
    audio.esSimulado && el('p', { clase: 'aviso', role: 'note', texto: T.simulacion }),
    el(
      'section',
      { clase: 'perfil__estadisticas', 'aria-label': T.estadisticas },
      crearEstadistica(T.xpTotal, estado.xpTotal),
      crearEstadistica(T.racha, rachaVigente(estado, hoy)),
      crearEstadistica(T.mejorRacha, estado.mejorRacha),
      crearEstadistica(T.lecciones, Object.keys(estado.lecciones).length),
      crearEstadistica(T.estrellas, totalEstrellas(estado)),
    ),
    crearTarjetaRango(estado),
    crearTarjetaTestOido(estado),
    el(
      'section',
      { clase: 'tarjeta perfil__seccion', 'aria-labelledby': 'perfil-objetivo' },
      el('h2', { clase: 'perfil__subtitulo', id: 'perfil-objetivo', texto: T.objetivo }),
      crearSelectorObjetivo(estado.objetivoDiarioXp, (xp) => actualizarEstado((actual) => ({ ...actual, objetivoDiarioXp: xp }))),
    ),
    el(
      'section',
      { clase: 'perfil__seccion', 'aria-labelledby': 'perfil-logros' },
      el('div', { clase: 'perfil__fila' }, el('h2', { clase: 'perfil__subtitulo', id: 'perfil-logros', texto: T.logros }), el('span', { clase: 'perfil__contador', texto: T.logrosFormato(conseguidos, LOGROS.length) })),
      el('ul', { clase: 'logros' }, LOGROS.map((logro) => crearLogro(logro, estado.logros[logro.id]))),
    ),
    crearTarjetaDiagnostico(),
    el('div', { clase: 'perfil__peligro' }, crearBoton(T.reiniciar, { variante: 'peligro-texto', onClick: confirmarBorrado })),
  );
  return { elemento };
}
