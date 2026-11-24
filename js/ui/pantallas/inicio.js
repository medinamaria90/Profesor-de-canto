// Pantalla principal: resumen del día, rutina de calentamiento y camino de lecciones.

import { el, prefiereMenosMovimiento } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { crearAnilloProgreso } from '../componentes/anillo-progreso.js';
import { crearEstrellas } from '../componentes/estrellas.js';
import { UNIDADES, RUTINA_DIARIA, leccionDesbloqueada, siguienteLeccionPendiente } from '../../contenido/curriculum.js';
import { TEXTOS } from '../../contenido/textos.js';
import { obtenerEstado } from '../../estado/tienda.js';
import { fechaClave, rachaVigente, xpHoy, rutinaHechaHoy, estrellasLeccion, XP_RUTINA_DIARIA } from '../../estado/progreso.js';
import { navegar } from '../../nucleo/router.js';
import { consumirAvisosPendientes } from '../../estado/sesion.js';
import { mostrarAviso } from '../componentes/aviso.js';

const T = TEXTOS.inicio;
// Desplazamiento lateral de los nodos del camino, en ciclos de cuatro.
const PATRON_ZIGZAG = ['centro', 'derecha', 'centro', 'izquierda'];
const DURACION_AVISO_MS = 3500;

function crearCabecera(estado, hoy) {
  const racha = rachaVigente(estado, hoy);
  const xpDeHoy = xpHoy(estado, hoy);
  const objetivoCumplido = xpDeHoy >= estado.objetivoDiarioXp;
  const anillo = crearAnilloProgreso({
    valor: xpDeHoy,
    maximo: estado.objetivoDiarioXp,
    etiqueta: T.xpHoyFormato(xpDeHoy, estado.objetivoDiarioXp),
    contenido: icono(objetivoCumplido ? 'check' : 'rayo', { tamano: 22 }),
  });
  return el(
    'header',
    { clase: 'inicio__cabecera' },
    el(
      'div',
      { clase: 'inicio__saludo' },
      el('h1', { clase: 'inicio__titulo', texto: T.saludo(estado.nombre) }),
      el('p', { clase: 'inicio__subtitulo', texto: objetivoCumplido ? T.objetivoCumplido : T.xpHoyFormato(xpDeHoy, estado.objetivoDiarioXp) }),
    ),
    el(
      'div',
      { clase: 'inicio__indicadores' },
      el(
        'div',
        { clase: `chip chip--racha ${racha === 0 ? 'chip--apagado' : ''}`.trim(), 'aria-label': `${T.rachaEtiqueta}: ${T.diasFormato(racha)}` },
        icono('fuego', { tamano: 20 }),
        el('span', { texto: String(racha), 'aria-hidden': 'true' }),
      ),
      anillo.elemento,
    ),
  );
}

function crearTarjetaRutina(estado, hoy) {
  const hecha = rutinaHechaHoy(estado, hoy);
  return el(
    'section',
    { clase: `tarjeta tarjeta-rutina ${hecha ? 'tarjeta-rutina--hecha' : ''}`.trim(), 'aria-labelledby': 'rutina-titulo' },
    el(
      'div',
      { clase: 'tarjeta-rutina__texto' },
      el('h2', { clase: 'tarjeta-rutina__titulo', id: 'rutina-titulo', texto: T.rutinaTitulo }),
      el('p', { clase: 'tarjeta-rutina__detalle', texto: hecha ? T.rutinaHecha : T.rutinaDetalle(RUTINA_DIARIA.minutos, XP_RUTINA_DIARIA) }),
    ),
    crearBoton(hecha ? T.rutinaRepetir : T.rutinaBoton, { variante: hecha ? 'tonal' : 'relleno', onClick: () => navegar(`/leccion/${RUTINA_DIARIA.id}`) }),
  );
}

function crearNodoLeccion(leccion, estado, esActual, posicion) {
  const estrellas = estrellasLeccion(estado, leccion.id);
  const desbloqueada = leccionDesbloqueada(estado, leccion.id);
  const completada = estrellas > 0;
  const estadoNodo = !desbloqueada ? 'bloqueada' : esActual ? 'actual' : completada ? 'completada' : 'disponible';
  const descripcionId = `nodo-desc-${leccion.id}`;
  const boton = el(
    'button',
    {
      clase: `camino__boton camino__boton--${estadoNodo}`,
      type: 'button',
      disabled: !desbloqueada,
      'aria-describedby': descripcionId,
      onClick: () => navegar(`/leccion/${leccion.id}`),
    },
    el('span', { clase: 'camino__icono', 'aria-hidden': 'true', texto: desbloqueada ? leccion.icono : '' }),
    !desbloqueada && el('span', { clase: 'camino__candado' }, icono('candado', { tamano: 22 })),
    esActual && el('span', { clase: 'camino__burbuja', 'aria-hidden': 'true', texto: completada ? T.repetir : T.empezar }),
  );
  const descripcion = !desbloqueada ? T.bloqueada : T.estrellasFormato(estrellas);
  return el(
    'li',
    { clase: `camino__nodo camino__nodo--${posicion} ${esActual ? 'camino__nodo--actual' : ''}`.trim() },
    boton,
    el('span', { clase: 'camino__titulo', texto: leccion.titulo }),
    desbloqueada && crearEstrellas(estrellas, { tamano: 's' }),
    el('span', { clase: 'visualmente-oculto', id: descripcionId, texto: `${leccion.titulo}. ${descripcion}` }),
  );
}

function crearUnidad(unidad, estado, leccionActual) {
  return el(
    'section',
    { clase: 'unidad', datos: { unidad: String(unidad.numero) }, 'aria-labelledby': `unidad-${unidad.id}` },
    el(
      'header',
      { clase: 'unidad__cabecera' },
      el('p', { clase: 'unidad__numero', texto: T.unidadFormato(unidad.numero) }),
      el('h2', { clase: 'unidad__titulo', id: `unidad-${unidad.id}`, texto: unidad.titulo }),
      el('p', { clase: 'unidad__descripcion', texto: unidad.descripcion }),
    ),
    el(
      'ol',
      { clase: 'camino' },
      unidad.lecciones.map((leccion, indice) => crearNodoLeccion(leccion, estado, leccionActual?.id === leccion.id, PATRON_ZIGZAG[indice % PATRON_ZIGZAG.length])),
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
    crearTarjetaRutina(estado, hoy),
    UNIDADES.map((unidad) => crearUnidad(unidad, estado, leccionActual)),
  );
  return {
    elemento,
    montado() {
      consumirAvisosPendientes().forEach((texto, indice) => mostrarAviso(texto, { retrasoMs: indice * DURACION_AVISO_MS }));
      const nodoActual = elemento.querySelector('.camino__boton--actual');
      if (nodoActual) {
        requestAnimationFrame(() => nodoActual.scrollIntoView({ block: 'center', behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth' }));
      }
    },
  };
}
