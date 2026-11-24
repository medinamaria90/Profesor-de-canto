// Test de oído: se elige una parte (relativo o absoluto), se hace y se ven resultados y consejos.

import { el } from '../dom.js';
import { crearBoton, crearBotonIcono } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { crearBarraProgreso } from '../componentes/barra-progreso.js';
import { reproducirGuia } from '../../ejercicios/comun.js';
import {
  crearEscalera,
  responderRelativo,
  intervaloActual,
  umbralRelativo,
  valorarRelativo,
  evaluarAbsoluto,
  valorarAbsoluto,
  notaAbsolutaAleatoria,
  parRelativo,
  debeDetenerAbsoluto,
  poblacionRelativo,
  PREGUNTAS_RELATIVO,
  PREGUNTAS_ABSOLUTO,
  UMBRAL_PROFESIONAL_CENTS,
  UMBRAL_MEDIA_SIN_ENTRENAR_CENTS,
} from '../../ejercicios/test-oido-logica.js';
import { NOMBRES_NOTAS, nombreNota } from '../../musica/notas.js';
import { TEXTOS } from '../../contenido/textos.js';
import { actualizarEstado } from '../../estado/tienda.js';
import { fechaClave, registrarTestOido } from '../../estado/progreso.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.testOido;
const MS_TRAS_RESPUESTA = 700;

export function crearPantallaTestOido() {
  const barra = crearBarraProgreso({ valor: 0, maximo: 1, etiqueta: T.titulo });
  const contador = el('span', { clase: 'leccion__contador', 'aria-hidden': 'true' });
  const titulo = el('span', { clase: 'leccion__titulo', texto: T.titulo });
  const area = el('div', { clase: 'leccion__area' });
  const pie = el('div', { clase: 'leccion__pie leccion__pie--vacio' });
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-leccion', 'aria-label': T.titulo },
    el(
      'header',
      { clase: 'leccion__cabecera' },
      crearBotonIcono(icono('cerrar'), { ariaLabel: TEXTOS.perfil.cancelar, onClick: () => navegar('/perfil') }),
      el('div', { clase: 'leccion__progreso' }, el('div', { clase: 'leccion__fila' }, titulo, contador), barra.elemento),
    ),
    area,
    pie,
  );

  let escalera = crearEscalera();
  let respuestasAbsoluto = [];
  let notaAnterior = null;
  let pregunta = 0;
  let total = 0;
  let destruida = false;

  function fijarAcciones(acciones) {
    pie.className = 'leccion__pie';
    pie.classList.toggle('leccion__pie--vacio', acciones.length === 0);
    pie.replaceChildren(...acciones.map((accion) => crearBoton(accion.texto, { variante: accion.variante ?? 'relleno', ancho: true, onClick: accion.accion })));
  }

  function avanzarProgreso() {
    pregunta++;
    barra.actualizar(pregunta);
    contador.textContent = `${Math.min(pregunta + 1, total)}/${total}`;
  }

  function empezarParte(parte, preguntas) {
    pregunta = 0;
    total = preguntas;
    barra.fijarMaximo(total);
    barra.actualizar(0);
    contador.textContent = `1/${total}`;
    titulo.textContent = parte === 'relativo' ? T.parteRelativa : T.parteAbsoluta;
    escalera = crearEscalera();
    respuestasAbsoluto = [];
    notaAnterior = null;
    if (parte === 'relativo') preguntaRelativa();
    else preguntaAbsoluta();
  }

  function eleccion() {
    titulo.textContent = T.titulo;
    contador.textContent = '';
    barra.actualizar(0);
    area.replaceChildren(
      el(
        'div',
        { clase: 'ejercicio' },
        el('h1', { clase: 'ejercicio__instruccion', texto: T.introTitulo }),
        el(
          'div',
          { clase: 'opciones opciones--vertical' },
          el('button', { clase: 'opcion', type: 'button', onClick: () => empezarParte('relativo', PREGUNTAS_RELATIVO) }, el('span', { clase: 'opcion__texto', texto: T.parteRelativa }), el('span', { clase: 'opcion__detalle', texto: T.introRelativo })),
          el('button', { clase: 'opcion', type: 'button', onClick: () => empezarParte('absoluto', PREGUNTAS_ABSOLUTO) }, el('span', { clase: 'opcion__texto', texto: T.parteAbsoluta }), el('span', { clase: 'opcion__detalle', texto: T.introAbsoluto })),
        ),
        el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.introDuracion }),
      ),
    );
    fijarAcciones([]);
  }

  function marcarOpciones(botones, opciones, elegida, correcta) {
    botones.forEach((boton, indice) => {
      boton.disabled = true;
      if (opciones[indice] === correcta) boton.classList.add('opcion--correcta');
      else if (opciones[indice] === elegida) boton.classList.add('opcion--incorrecta');
    });
  }

  async function preguntaRelativa() {
    if (destruida) return;
    if (escalera.historial.length >= PREGUNTAS_RELATIVO) {
      resultadosRelativo();
      return;
    }
    fijarAcciones([]);
    const par = parRelativo(intervaloActual(escalera), Math.random);
    const opciones = ['primera', 'segunda'];
    const estado = el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite', texto: `${TEXTOS.leccion.escuchar}…` });
    const botones = opciones.map((valor) =>
      el('button', { clase: 'opcion', type: 'button', disabled: true, onClick: () => responder(valor) }, el('span', { clase: 'opcion__texto', texto: valor === 'primera' ? TEXTOS.ejercicios.escucha.primera : TEXTOS.ejercicios.escucha.segunda })),
    );
    area.replaceChildren(el('div', { clase: 'ejercicio' }, el('h2', { clase: 'ejercicio__instruccion', texto: TEXTOS.ejercicios.escucha.preguntaAgudo }), el('div', { clase: 'opciones' }, botones), estado));
    const responder = (valor) => {
      const acierto = valor === par.respuestaCorrecta;
      marcarOpciones(botones, opciones, valor, par.respuestaCorrecta);
      estado.textContent = acierto ? TEXTOS.ejercicios.escucha.correcto : T.incorrectoRelativo;
      escalera = responderRelativo(escalera, acierto);
      avanzarProgreso();
      setTimeout(preguntaRelativa, MS_TRAS_RESPUESTA);
    };
    await reproducirGuia(par.notas);
    if (destruida) return;
    estado.textContent = T.tuRespuesta;
    botones.forEach((boton) => {
      boton.disabled = false;
    });
    fijarAcciones([{ texto: TEXTOS.leccion.escucharOtraVez, variante: 'tonal', accion: () => reproducirGuia(par.notas) }]);
  }

  async function preguntaAbsoluta() {
    if (destruida) return;
    if (debeDetenerAbsoluto(respuestasAbsoluto)) {
      resultadosAbsoluto();
      return;
    }
    fijarAcciones([]);
    const midi = notaAbsolutaAleatoria(notaAnterior, Math.random);
    notaAnterior = midi;
    const correcta = midi % 12;
    const grados = NOMBRES_NOTAS.map((_, grado) => grado);
    const estado = el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite', texto: `${TEXTOS.leccion.escuchar}…` });
    const botones = grados.map((grado) =>
      el('button', { clase: 'opcion opcion--nota', type: 'button', disabled: true, onClick: () => responder(grado) }, el('span', { clase: 'opcion__texto', texto: NOMBRES_NOTAS[grado] })),
    );
    area.replaceChildren(el('div', { clase: 'ejercicio' }, el('h2', { clase: 'ejercicio__instruccion', texto: T.preguntaAbsoluta }), el('div', { clase: 'opciones opciones--notas' }, botones), estado));
    const responder = (grado) => {
      marcarOpciones(botones, grados, grado, correcta);
      estado.textContent = grado === correcta ? TEXTOS.ejercicios.escucha.correcto : T.eraFormato(nombreNota(midi, false));
      respuestasAbsoluto = [...respuestasAbsoluto, { correcta, elegida: grado }];
      avanzarProgreso();
      setTimeout(preguntaAbsoluta, MS_TRAS_RESPUESTA);
    };
    await reproducirGuia([midi]);
    if (destruida) return;
    estado.textContent = T.tuRespuesta;
    botones.forEach((boton) => {
      boton.disabled = false;
    });
    fijarAcciones([{ texto: TEXTOS.leccion.escucharOtraVez, variante: 'tonal', accion: () => reproducirGuia([midi]) }]);
  }

  function mostrarResultado(encabezado, lineas) {
    area.replaceChildren(
      el(
        'div',
        { clase: 'ejercicio' },
        el('h1', { clase: 'ejercicio__instruccion', texto: encabezado }),
        el('section', { clase: 'tarjeta tecnica' }, lineas),
      ),
    );
    fijarAcciones([{ texto: TEXTOS.resultados.continuar, accion: () => navegar('/perfil') }, { texto: T.repetir, variante: 'texto', accion: eleccion }]);
  }

  function resultadosRelativo() {
    const umbral = umbralRelativo(escalera);
    const nivel = valorarRelativo(umbral);
    actualizarEstado((estado) => registrarTestOido(estado, { umbralCents: umbral }, fechaClave()));
    mostrarResultado(T.parteRelativa, [
      el('p', { clase: 'tecnica__resumen', texto: T.umbralFormato(umbral) }),
      el('p', { texto: `${T.valoracionRelativa[nivel]} ${T.poblacionFormato(poblacionRelativo(umbral).texto)}` }),
      el('p', { clase: 'tecnica__consejo', texto: T.consejoRelativo[nivel] }),
      el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: `${T.margenFormato(umbral, UMBRAL_PROFESIONAL_CENTS, UMBRAL_MEDIA_SIN_ENTRENAR_CENTS)} ${T.fuentesRelativo}` }),
    ]);
  }

  function resultadosAbsoluto() {
    const absoluto = evaluarAbsoluto(respuestasAbsoluto);
    const nivel = valorarAbsoluto(absoluto);
    actualizarEstado((estado) => registrarTestOido(estado, { aciertosAbsoluto: absoluto.exactas, totalAbsoluto: absoluto.total }, fechaClave()));
    mostrarResultado(T.parteAbsoluta, [
      el('p', { clase: 'tecnica__resumen', texto: T.absolutoFormato(absoluto.exactas, absoluto.total, absoluto.cercanas, absoluto.azar) }),
      el('p', { texto: T.valoracionAbsoluta[nivel] }),
      el('p', { clase: 'tecnica__consejo', texto: T.consejoAbsoluto[nivel] }),
      el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.oidoAbsolutoExplicacion }),
    ]);
  }

  return {
    elemento,
    montado() {
      audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
      eleccion();
    },
    destruir() {
      destruida = true;
      audio.detenerTodo();
    },
  };
}
