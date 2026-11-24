// Ejercicio de oído sin micrófono: escuchar dos notas y responder.

import { el } from '../ui/dom.js';
import { icono } from '../ui/componentes/iconos.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, reproducirGuia, SEGUNDOS_ENTRE_NOTAS_GUIA } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { TEXTOS } from '../contenido/textos.js';
import { actualizarEstado } from '../estado/tienda.js';
import { registrarRespuestaOido } from '../estado/progreso.js';

const T = TEXTOS.ejercicios.escucha;
const MS_POR_SEGUNDO = 1000;

const OPCIONES_POR_VARIANTE = {
  agudo: [
    { valor: 'primera', texto: T.primera },
    { valor: 'segunda', texto: T.segunda },
  ],
  igual: [
    { valor: 'iguales', texto: T.iguales },
    { valor: 'diferentes', texto: T.diferentes },
  ],
};

export function crearEjercicioEscucha(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const pregunta = ejercicio.variante === 'agudo' ? T.preguntaAgudo : T.preguntaIgual;
  const cabecera = crearCabeceraEjercicio(T.tituloNivel(ejercicio.nivel ?? 1), pregunta);
  const estado = crearEstadoEjercicio();
  const fichas = ejercicio.notas.map((_, indice) =>
    el('div', { clase: 'escucha__ficha', 'aria-hidden': 'true' }, icono('nota', { tamano: 28 }), el('span', { texto: String(indice + 1) })),
  );
  let respondido = false;
  const temporizadores = [];

  const botones = OPCIONES_POR_VARIANTE[ejercicio.variante].map((opcion) =>
    el(
      'button',
      {
        clase: 'opcion',
        type: 'button',
        onClick: () => responder(opcion.valor),
      },
      el('span', { clase: 'opcion__texto', texto: opcion.texto }),
    ),
  );

  contenedor.append(cabecera.elemento, el('div', { clase: 'escucha__fichas' }, fichas), el('div', { clase: 'opciones' }, botones), estado);

  async function reproducir() {
    if (respondido) return;
    fijarAcciones([]);
    botones.forEach((boton) => {
      boton.disabled = true;
    });
    fichas.forEach((ficha) => ficha.classList.remove('escucha__ficha--sonando'));
    const promesa = reproducirGuia(ejercicio.notas);
    ejercicio.notas.forEach((_, indice) => {
      temporizadores.push(setTimeout(() => fichas[indice]?.classList.add('escucha__ficha--sonando'), indice * SEGUNDOS_ENTRE_NOTAS_GUIA * MS_POR_SEGUNDO));
    });
    await promesa;
    if (respondido) return;
    botones.forEach((boton) => {
      boton.disabled = false;
    });
    fijarAcciones([{ texto: TEXTOS.leccion.escucharOtraVez, variante: 'tonal', accion: reproducir }]);
  }

  function responder(valor) {
    if (respondido) return;
    respondido = true;
    const acierto = valor === ejercicio.respuestaCorrecta;
    actualizarEstado((estado) => registrarRespuestaOido(estado, acierto));
    botones.forEach((boton, indice) => {
      boton.disabled = true;
      const opcion = OPCIONES_POR_VARIANTE[ejercicio.variante][indice];
      if (opcion.valor === ejercicio.respuestaCorrecta) boton.classList.add('opcion--correcta');
      else if (opcion.valor === valor) boton.classList.add('opcion--incorrecta');
    });
    alTerminar({ puntuacion: acierto ? PUNTUACION_MAXIMA : 0, titulo: acierto ? T.correcto : T.incorrecto });
  }

  return {
    iniciar: reproducir,
    destruir() {
      respondido = true;
      temporizadores.forEach(clearTimeout);
    },
  };
}
