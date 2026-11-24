// Pantalla principal: cabecera con marca y chips, tarjetas del día y camino de lecciones.

import { el, prefiereMenosMovimiento } from '../dom.js';
import { icono } from '../componentes/iconos.js';
import { crearAnilloProgreso } from '../componentes/anillo-progreso.js';
import { crearEstrellas } from '../componentes/estrellas.js';
import { UNIDADES, RUTINA_DIARIA, leccionDesbloqueada, siguienteLeccionPendiente } from '../../contenido/curriculum.js';
import { TEXTOS } from '../../contenido/textos.js';
import { obtenerEstado } from '../../estado/tienda.js';
import { fechaClave, rachaVigente, xpHoy, rutinaHechaHoy, estrellasLeccion, XP_RUTINA_DIARIA, ultimoTestOido } from '../../estado/progreso.js';
import { navegar } from '../../nucleo/router.js';
import { consumirAvisosPendientes } from '../../estado/sesion.js';
import { mostrarAviso } from '../componentes/aviso.js';

const T = TEXTOS.inicio;
const DURACION_AVISO_MS = 3500;
const TAMANO_ANILLO_CHIP = 30;
const GROSOR_ANILLO_CHIP = 4;

function crearChip({ etiqueta, contenido, texto, apagado = false, destino = '/perfil' }) {
  return el(
    'a',
    { clase: 'chip', href: `#${destino}`, 'aria-label': etiqueta },
    el(
      'span',
      { clase: 'chip__pastilla', 'aria-hidden': 'true' },
      el('span', { clase: `chip__icono ${apagado ? 'chip__icono--apagado' : ''}`.trim() }, contenido),
      el('span', { texto }),
    ),
  );
}

function crearCabecera(estado, hoy) {
  const racha = rachaVigente(estado, hoy);
  const xpDeHoy = xpHoy(estado, hoy);
  const objetivoCumplido = xpDeHoy >= estado.objetivoDiarioXp;
  const anillo = crearAnilloProgreso({
    valor: xpDeHoy,
    maximo: estado.objetivoDiarioXp,
    tamano: TAMANO_ANILLO_CHIP,
    grosor: GROSOR_ANILLO_CHIP,
    etiqueta: T.xpHoyFormato(xpDeHoy, estado.objetivoDiarioXp),
    contenido: objetivoCumplido ? icono('check', { tamano: 14 }) : null,
  });
  return el(
    'header',
    { clase: 'inicio__cabecera' },
    el('a', { clase: 'marca', href: '#/' }, icono('alondra', { tamano: 28 }), el('span', { texto: TEXTOS.app.nombre })),
    el(
      'div',
      { clase: 'inicio__indicadores' },
      crearChip({
        etiqueta: objetivoCumplido ? T.objetivoCumplido : T.xpHoyFormato(xpDeHoy, estado.objetivoDiarioXp),
        contenido: anillo.elemento,
        texto: String(xpDeHoy),
      }),
      crearChip({
        etiqueta: `${T.rachaEtiqueta}: ${T.diasFormato(racha)}`,
        contenido: icono('fuego', { tamano: 20 }),
        texto: String(racha),
        apagado: racha === 0,
      }),
    ),
  );
}

function crearTarjetaAccion({ principal = false, icono: emoji, sobretitulo, titulo, detalle, estado, hecho = false, destino, etiqueta }) {
  return el(
    'button',
    {
      clase: `tarjeta-accion ${principal ? 'tarjeta-accion--principal' : ''}`.trim(),
      type: 'button',
      'aria-label': etiqueta,
      onClick: () => navegar(destino),
    },
    el('span', { clase: 'tarjeta-accion__icono', 'aria-hidden': 'true', texto: emoji }),
    el(
      'span',
      { clase: 'tarjeta-accion__texto' },
      sobretitulo && el('span', { clase: 'tarjeta-accion__sobretitulo', texto: sobretitulo }),
      el('span', { clase: 'tarjeta-accion__titulo', texto: titulo }),
      detalle && el('span', { clase: 'tarjeta-accion__detalle', texto: detalle }),
    ),
    estado && el('span', { clase: `tarjeta-accion__estado ${hecho ? 'tarjeta-accion__estado--hecho' : ''}`.trim(), texto: estado }),
    principal && el('span', { clase: 'tarjeta-accion__ir', 'aria-hidden': 'true' }, icono('reproducir', { tamano: 22 })),
  );
}

function crearTarjetasDelDia(estado, hoy, leccionActual) {
  const rutinaHecha = rutinaHechaHoy(estado, hoy);
  const unidadActual = leccionActual && UNIDADES.find((unidad) => unidad.lecciones.some((leccion) => leccion.id === leccionActual.id));
  return el(
    'section',
    { clase: 'hoy', 'aria-label': T.hoy },
    leccionActual &&
      crearTarjetaAccion({
        principal: true,
        icono: leccionActual.icono,
        sobretitulo: T.sigueCon,
        titulo: leccionActual.titulo,
        detalle: unidadActual && `${T.unidadFormato(unidadActual.numero)} · ${unidadActual.titulo}`,
        destino: `/leccion/${leccionActual.id}`,
        etiqueta: `${T.sigueCon} ${leccionActual.titulo}`,
      }),
    crearTarjetaAccion({
      icono: RUTINA_DIARIA.icono,
      titulo: T.rutinaTitulo,
      detalle: T.rutinaDetalle(RUTINA_DIARIA.minutos, XP_RUTINA_DIARIA),
      estado: rutinaHecha ? T.rutinaHecha : T.rutinaBoton,
      hecho: rutinaHecha,
      destino: `/leccion/${RUTINA_DIARIA.id}`,
      etiqueta: `${T.rutinaTitulo}. ${rutinaHecha ? T.rutinaHecha : T.rutinaDetalle(RUTINA_DIARIA.minutos, XP_RUTINA_DIARIA)}`,
    }),
    !ultimoTestOido(estado) &&
      crearTarjetaAccion({
        icono: '👂',
        titulo: TEXTOS.testOido.tarjetaTitulo,
        detalle: TEXTOS.testOido.tarjetaTexto,
        estado: TEXTOS.testOido.hacerTest,
        destino: '/test-oido',
        etiqueta: `${TEXTOS.testOido.tarjetaTitulo}. ${TEXTOS.testOido.tarjetaTexto}`,
      }),
  );
}

function crearNodoLeccion(leccion, estado, esActual) {
  const estrellas = estrellasLeccion(estado, leccion.id);
  const desbloqueada = leccionDesbloqueada(estado, leccion.id);
  const completada = estrellas > 0;
  const estadoNodo = !desbloqueada ? 'bloqueada' : esActual ? 'actual' : completada ? 'completada' : 'disponible';
  const descripcion = !desbloqueada ? T.bloqueada : T.estrellasFormato(estrellas);
  const boton = el(
    'button',
    {
      clase: `camino__boton camino__boton--${estadoNodo}`,
      type: 'button',
      disabled: !desbloqueada,
      'aria-label': `${leccion.titulo}. ${descripcion}`,
      onClick: () => navegar(`/leccion/${leccion.id}`),
    },
    desbloqueada && el('span', { clase: 'camino__icono', 'aria-hidden': 'true', texto: leccion.icono }),
    !desbloqueada && el('span', { clase: 'camino__candado' }, icono('candado', { tamano: 22 })),
    completada && !esActual && el('span', { clase: 'camino__sello', 'aria-hidden': 'true' }, icono('check', { tamano: 16 })),
  );
  return el(
    'li',
    { clase: `camino__nodo camino__nodo--${estadoNodo}` },
    boton,
    el(
      'div',
      { clase: 'camino__texto' },
      el('span', { clase: 'camino__titulo', texto: leccion.titulo }),
      el(
        'span',
        { clase: 'camino__meta' },
        desbloqueada ? crearEstrellas(estrellas, { tamano: 's' }) : el('span', { texto: T.bloqueada }),
        esActual && el('span', { texto: completada ? T.repetir : T.empezar }),
      ),
    ),
  );
}

function crearUnidad(unidad, estado, leccionActual) {
  return el(
    'section',
    { clase: 'unidad', datos: { unidad: String(unidad.numero) }, 'aria-labelledby': `unidad-${unidad.id}` },
    el(
      'header',
      { clase: 'unidad__cabecera' },
      el(
        'div',
        { clase: 'unidad__titulos' },
        el('p', { clase: 'unidad__numero', texto: T.unidadFormato(unidad.numero) }),
        el('h2', { clase: 'unidad__titulo', id: `unidad-${unidad.id}`, texto: unidad.titulo }),
        el('p', { clase: 'unidad__descripcion', texto: unidad.descripcion }),
      ),
    ),
    el(
      'ol',
      { clase: 'camino' },
      unidad.lecciones.map((leccion) => crearNodoLeccion(leccion, estado, leccionActual?.id === leccion.id)),
    ),
  );
}

export function crearPantallaInicio() {
  const estado = obtenerEstado();
  const hoy = fechaClave();
  const leccionActual = siguienteLeccionPendiente(estado);
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-inicio' },
    crearCabecera(estado, hoy),
    crearTarjetasDelDia(estado, hoy, leccionActual),
    UNIDADES.map((unidad) => crearUnidad(unidad, estado, leccionActual)),
  );
  return {
    elemento,
    montado() {
      consumirAvisosPendientes().forEach((texto, indice) => mostrarAviso(texto, { retrasoMs: indice * DURACION_AVISO_MS }));
      const nodoActual = elemento.querySelector('.camino__boton--actual');
      if (nodoActual && nodoActual.getBoundingClientRect().bottom > window.innerHeight) {
        requestAnimationFrame(() => nodoActual.scrollIntoView({ block: 'center', behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' }));
      }
    },
  };
}
