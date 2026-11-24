// Bienvenida en tres pasos: nombre, objetivo diario y medición opcional del rango vocal.

import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { crearBarraProgreso } from '../componentes/barra-progreso.js';
import { icono } from '../componentes/iconos.js';
import { TEXTOS } from '../../contenido/textos.js';
import { actualizarEstado, obtenerEstado } from '../../estado/tienda.js';
import { completarBienvenida, OBJETIVOS_DIARIOS } from '../../estado/progreso.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.bienvenida;
const TOTAL_PASOS = 3;
const LONGITUD_MAXIMA_NOMBRE = 24;

export function crearSelectorObjetivo(valorInicial, alCambiar) {
  let seleccionado = valorInicial;
  const botones = OBJETIVOS_DIARIOS.map((objetivo) =>
    el(
      'button',
      {
        clase: 'opcion opcion--objetivo',
        type: 'button',
        role: 'radio',
        'aria-checked': String(objetivo.xp === seleccionado),
        onClick: () => {
          seleccionado = objetivo.xp;
          botones.forEach((boton, indice) => boton.setAttribute('aria-checked', String(OBJETIVOS_DIARIOS[indice].xp === seleccionado)));
          alCambiar(seleccionado);
        },
      },
      el('span', { clase: 'opcion__texto', texto: T.objetivos[objetivo.id] }),
      el('span', { clase: 'opcion__detalle', texto: `${T.minutosFormato(objetivo.minutos)} · ${T.xpFormato(objetivo.xp)}` }),
    ),
  );
  return el('div', { clase: 'opciones opciones--vertical', role: 'radiogroup', 'aria-label': T.objetivoTitulo }, botones);
}

export function crearPantallaBienvenida() {
  const estado = obtenerEstado();
  let paso = 1;
  let nombre = estado.nombre;
  let objetivo = estado.objetivoDiarioXp;

  const barra = crearBarraProgreso({ valor: paso, maximo: TOTAL_PASOS, etiqueta: T.pasoFormato(paso, TOTAL_PASOS) });
  const indicadorPaso = el('p', { clase: 'bienvenida__paso', texto: T.pasoFormato(paso, TOTAL_PASOS) });
  const contenido = el('div', { clase: 'bienvenida__contenido' });
  const pie = el('div', { clase: 'bienvenida__pie' });
  const elemento = el('section', { clase: 'pantalla pantalla-bienvenida' }, el('header', { clase: 'bienvenida__cabecera' }, indicadorPaso, barra.elemento), contenido, pie);

  function irA(nuevoPaso) {
    paso = nuevoPaso;
    barra.actualizar(paso);
    indicadorPaso.textContent = T.pasoFormato(paso, TOTAL_PASOS);
    audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
    if (paso === 1) pasoNombre();
    else if (paso === 2) pasoObjetivo();
    else pasoRango();
  }

  function terminar(medirRango) {
    actualizarEstado((actual) => completarBienvenida(actual, { nombre, objetivoDiarioXp: objetivo }));
    navegar(medirRango ? '/rango?volver=/' : '/', { reemplazar: true });
  }

  function pasoNombre() {
    const campo = el('input', {
      clase: 'campo',
      id: 'campo-nombre',
      type: 'text',
      autocomplete: 'given-name',
      maxlength: LONGITUD_MAXIMA_NOMBRE,
      placeholder: T.nombreMarcador,
      value: nombre,
      onInput: (evento) => {
        nombre = evento.target.value;
      },
      onKeydown: (evento) => {
        if (evento.key === 'Enter') irA(2);
      },
    });
    contenido.replaceChildren(
      el('div', { clase: 'bienvenida__logo', 'aria-hidden': 'true' }, icono('nota', { tamano: 48 })),
      el('h1', { clase: 'bienvenida__titulo', texto: T.titulo }),
      el('p', { clase: 'bienvenida__texto', texto: T.subtitulo }),
      el('label', { clase: 'etiqueta', for: 'campo-nombre', texto: T.nombreEtiqueta }),
      campo,
    );
    pie.replaceChildren(crearBoton(T.siguiente, { ancho: true, onClick: () => irA(2) }));
    campo.focus();
  }

  function pasoObjetivo() {
    contenido.replaceChildren(
      el('h1', { clase: 'bienvenida__titulo', texto: T.objetivoTitulo }),
      el('p', { clase: 'bienvenida__texto', texto: T.objetivoSubtitulo }),
      crearSelectorObjetivo(objetivo, (valor) => {
        objetivo = valor;
      }),
    );
    pie.replaceChildren(crearBoton(T.siguiente, { ancho: true, onClick: () => irA(3) }));
  }

  function pasoRango() {
    contenido.replaceChildren(
      el('div', { clase: 'bienvenida__logo', 'aria-hidden': 'true' }, icono('microfono', { tamano: 48 })),
      el('h1', { clase: 'bienvenida__titulo', texto: T.rangoTitulo }),
      el('p', { clase: 'bienvenida__texto', texto: T.rangoSubtitulo }),
    );
    pie.replaceChildren(
      crearBoton(T.medirRango, { ancho: true, onClick: () => terminar(true) }),
      crearBoton(T.saltarRango, { variante: 'texto', ancho: true, onClick: () => terminar(false) }),
    );
  }

  return {
    elemento,
    montado() {
      irA(1);
    },
  };
}
