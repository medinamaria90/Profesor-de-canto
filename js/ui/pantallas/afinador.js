// Afinador libre: muestra la nota que cantas y cuánto te desvías.

import { el } from '../dom.js';
import { crearAfinadorVisual } from '../componentes/afinador-visual.js';
import { crearSolicitudMicrofono } from '../componentes/solicitud-microfono.js';
import { nombreNota, notaMasCercana, midiAFrecuencia } from '../../musica/notas.js';
import { TOLERANCIA_CENTS_AFINADO } from '../../ejercicios/puntuacion.js';
import { TEXTOS } from '../../contenido/textos.js';
import { audio } from '../../audio/servicio-audio.js';

const T = TEXTOS.afinador;
const MS_SIN_VOZ_PARA_RESETEAR = 600;
const CENTS_MAXIMOS_AGUJA = 50;
const GRADOS_MAXIMOS_AGUJA = 45;

export function crearPantallaAfinador() {
  const nombre = el('p', { clase: 'afinador__nota', texto: '–', 'aria-live': 'polite' });
  const cents = el('p', { clase: 'afinador__cents', texto: T.silencio });
  const aguja = el('div', { clase: 'afinador__aguja', 'aria-hidden': 'true' });
  const medidor = el('div', { clase: 'afinador__medidor', 'aria-hidden': 'true' }, el('div', { clase: 'afinador__escala' }), aguja);
  const visual = crearAfinadorVisual({ midiObjetivo: null, etiqueta: T.titulo });
  const area = el('div', { clase: 'afinador__area' });
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-afinador' },
    el('header', { clase: 'pantalla__cabecera' }, el('h1', { clase: 'pantalla__titulo', texto: T.titulo }), el('p', { clase: 'pantalla__subtitulo', texto: T.subtitulo })),
    area,
  );

  let lector = null;
  let ultimaVoz = 0;
  let objetivoActual = null;

  function mostrarSilencio() {
    nombre.textContent = '–';
    cents.textContent = T.silencio;
    aguja.style.setProperty('--angulo', '0deg');
    medidor.dataset.estado = 'silencio';
  }

  function alLeer(lectura) {
    const ahora = performance.now();
    if (!lectura.voz) {
      if (ahora - ultimaVoz > MS_SIN_VOZ_PARA_RESETEAR) mostrarSilencio();
      visual.redibujar();
      return;
    }
    ultimaVoz = ahora;
    const cercana = notaMasCercana(midiAFrecuencia(lectura.midi));
    if (cercana.midi !== objetivoActual) {
      objetivoActual = cercana.midi;
      visual.fijarObjetivo(cercana.midi);
    }
    visual.registrar(lectura.midi);
    const desvio = Math.round(cercana.cents);
    nombre.textContent = nombreNota(cercana.midi);
    cents.textContent = `${T.centsFormato(desvio)} · ${Math.abs(desvio) <= TOLERANCIA_CENTS_AFINADO / 2 ? T.afinado : desvio > 0 ? T.alto : T.bajo}`;
    const angulo = (Math.max(-CENTS_MAXIMOS_AGUJA, Math.min(CENTS_MAXIMOS_AGUJA, desvio)) / CENTS_MAXIMOS_AGUJA) * GRADOS_MAXIMOS_AGUJA;
    aguja.style.setProperty('--angulo', `${angulo}deg`);
    medidor.dataset.estado = Math.abs(desvio) <= TOLERANCIA_CENTS_AFINADO / 2 ? 'afinado' : 'desviado';
  }

  function arrancar() {
    area.replaceChildren(el('div', { clase: 'afinador__lectura tarjeta' }, nombre, medidor, cents), visual.elemento);
    visual.montar();
    mostrarSilencio();
    lector = audio.crearLector(alLeer);
    lector.iniciar();
  }

  return {
    elemento,
    montado() {
      if (audio.tieneEntrada()) arrancar();
      else if (audio.permisoConcedido()) audio.abrirEntrada().then(arrancar).catch(() => area.replaceChildren(crearSolicitudMicrofono({ alListo: arrancar }).elemento));
      else area.replaceChildren(crearSolicitudMicrofono({ alListo: arrancar }).elemento);
    },
    destruir() {
      lector?.detener();
      audio.cerrarEntrada();
      visual.destruir();
    },
  };
}
