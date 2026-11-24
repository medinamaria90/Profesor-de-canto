// Test de oído: oído relativo (escalera adaptativa) y oído absoluto (nombrar notas sueltas), con consejos.

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
  PREGUNTAS_RELATIVO,
  PREGUNTAS_ABSOLUTO,
  UMBRAL_PROFESIONAL_CENTS,
} from '../../ejercicios/test-oido-logica.js';
import { NOMBRES_NOTAS, nombreNota } from '../../musica/notas.js';
import { TEXTOS } from '../../contenido/textos.js';
import { actualizarEstado } from '../../estado/tienda.js';
import { fechaClave, registrarTestOido } from '../../estado/progreso.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.testOido;
const TOTAL_PREGUNTAS = PREGUNTAS_RELATIVO + PREGUNTAS_ABSOLUTO;
const MS_TRAS_RESPUESTA = 700;

export function crearPantallaTestOido() {
  const barra = crearBarraProgreso({ valor: 0, maximo: TOTAL_PREGUNTAS, etiqueta: T.titulo });
  const contador = el('span', { clase: 'leccion__contador', 'aria-hidden': 'true' });
  const area = el('div', { clase: 'leccion__area' });
  const pie = el('div', { clase: 'leccion__pie leccion__pie--vacio' });
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-leccion', 'aria-label': T.titulo },
    el(
      'header',
      { clase: 'leccion__cabecera' },
      crearBotonIcono(icono('cerrar'), { ariaLabel: TEXTOS.perfil.cancelar, onClick: () => navegar('/perfil') }),
      el('div', { clase: 'leccion__progreso' }, el('div', { clase: 'leccion__fila' }, el('span', { clase: 'leccion__titulo', texto: T.titulo }), contador), barra.elemento),
    ),
    area,
    pie,
  );

  let escalera = crearEscalera();
  let respuestasAbsoluto = [];
  let notaAnterior = null;
  let pregunta = 0;
  let destruida = false;

  function fijarAcciones(acciones) {
    pie.className = 'leccion__pie';
    pie.classList.toggle('leccion__pie--vacio', acciones.length === 0);
    pie.replaceChildren(...acciones.map((accion) => crearBoton(accion.texto, { variante: accion.variante ?? 'relleno', ancho: true, onClick: accion.accion })));
  }

  function avanzarProgreso() {
    pregunta++;
    barra.actualizar(pregunta);
    contador.textContent = `${Math.min(pregunta + 1, TOTAL_PREGUNTAS)}/${TOTAL_PREGUNTAS}`;
  }

  function intro() {
    area.replaceChildren(
      el('div', { clase: 'ejercicio' }, el('p', { clase: 'ejercicio__tipo', texto: T.titulo }), el('h1', { clase: 'ejercicio__instruccion', texto: T.introTitulo }),
        el('div', { clase: 'tarjeta tecnica' }, el('p', { clase: 'tecnica__resumen', texto: T.introRelativo }), el('p', { texto: T.introAbsoluto }), el('p', { clase: 'tecnica__consejo', texto: T.introDuracion })),
      ),
    );
    contador.textContent = `1/${TOTAL_PREGUNTAS}`;
    fijarAcciones([{ texto: T.empezar, accion: preguntaRelativa }]);
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
      preguntaAbsoluta();
      return;
    }
    fijarAcciones([]);
    const cents = intervaloActual(escalera);
    const par = parRelativo(cents, Math.random);
    const opciones = ['primera', 'segunda'];
    const estado = el('p', { clase: 'ejercicio__estado', 'aria-live': 'polite', texto: `${TEXTOS.leccion.escuchar}…` });
    const botones = opciones.map((valor) =>
      el('button', { clase: 'opcion', type: 'button', disabled: true, onClick: () => responder(valor) }, el('span', { clase: 'opcion__texto', texto: valor === 'primera' ? TEXTOS.ejercicios.escucha.primera : TEXTOS.ejercicios.escucha.segunda })),
    );
    area.replaceChildren(
      el('div', { clase: 'ejercicio' }, el('p', { clase: 'ejercicio__tipo', texto: T.parteRelativa }), el('h2', { clase: 'ejercicio__instruccion', texto: TEXTOS.ejercicios.escucha.preguntaAgudo }), el('div', { clase: 'opciones' }, botones), estado),
    );
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
      resultados();
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
    area.replaceChildren(
      el('div', { clase: 'ejercicio' }, el('p', { clase: 'ejercicio__tipo', texto: T.parteAbsoluta }), el('h2', { clase: 'ejercicio__instruccion', texto: T.preguntaAbsoluta }), el('div', { clase: 'opciones opciones--notas' }, botones), estado),
    );
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

  function resultados() {
    const umbral = umbralRelativo(escalera);
    const nivelRelativo = valorarRelativo(umbral);
    const absoluto = evaluarAbsoluto(respuestasAbsoluto);
    const nivelAbsoluto = valorarAbsoluto(absoluto);
    actualizarEstado((estado) => registrarTestOido(estado, { umbralCents: umbral, aciertosAbsoluto: absoluto.exactas, totalAbsoluto: absoluto.total }, fechaClave()));
    area.replaceChildren(
      el(
        'div',
        { clase: 'ejercicio' },
        el('p', { clase: 'ejercicio__tipo', texto: T.titulo }),
        el('h1', { clase: 'ejercicio__instruccion', texto: T.resultadosTitulo }),
        el(
          'section',
          { clase: 'tarjeta tecnica' },
          el('h2', { clase: 'perfil__subtitulo', texto: T.parteRelativa }),
          el('p', { clase: 'tecnica__resumen', texto: T.umbralFormato(umbral) }),
          el('p', { texto: T.valoracionRelativa[nivelRelativo] }),
          el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.margenFormato(umbral, UMBRAL_PROFESIONAL_CENTS) }),
          el('p', { clase: 'tecnica__consejo', texto: T.consejoRelativo[nivelRelativo] }),
        ),
        el(
          'section',
          { clase: 'tarjeta tecnica' },
          el('h2', { clase: 'perfil__subtitulo', texto: T.parteAbsoluta }),
          el('p', { clase: 'tecnica__resumen', texto: T.absolutoFormato(absoluto.exactas, absoluto.total, absoluto.cercanas, absoluto.azar) }),
          absoluto.total < PREGUNTAS_ABSOLUTO && el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.absolutoCortado }),
          el('p', { texto: T.valoracionAbsoluta[nivelAbsoluto] }),
          el('p', { clase: 'tecnica__consejo', texto: T.consejoAbsoluto[nivelAbsoluto] }),
          el('p', { clase: 'perfil__texto perfil__texto--pequeno', texto: T.oidoAbsolutoExplicacion }),
        ),
      ),
    );
    fijarAcciones([{ texto: TEXTOS.resultados.continuar, accion: () => navegar('/perfil') }, { texto: T.repetir, variante: 'texto', accion: reiniciar }]);
  }

  function reiniciar() {
    escalera = crearEscalera();
    respuestasAbsoluto = [];
    notaAnterior = null;
    pregunta = 0;
    barra.actualizar(0);
    intro();
  }

  return {
    elemento,
    montado() {
      audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
      intro();
    },
    destruir() {
      destruida = true;
      audio.detenerTodo();
    },
  };
}
