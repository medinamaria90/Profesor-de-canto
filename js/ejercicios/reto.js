// Reto: la Bola cantora dentro de una lección, con las puertas siguiendo las notas de la canción.

import { el } from '../ui/dom.js';
import { icono } from '../ui/componentes/iconos.js';
import { crearVistaBolaCantora } from '../juegos/bola-cantora-vista.js';
import { crearPartida, empezar, fijarVoz, avanzar, puertaSiguiente, VIDAS_INICIALES } from '../juegos/bola-cantora-logica.js';
import { nombreNota } from '../musica/notas.js';
import { GANANCIA_ACOMPANAMIENTO } from '../audio/sintetizador.js';
import { audio } from '../audio/servicio-audio.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.reto;
const PASO_MAXIMO_SEGUNDOS = 0.05;
const DURACION_NOTA_GUIA_SEGUNDOS = 0.5;

export function crearEjercicioReto(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, T.instruccion(ejercicio.titulo));
  const vista = crearVistaBolaCantora();
  const marcador = el('span', { clase: 'juego__marcador-valor', texto: `0/${ejercicio.notas.length}` });
  const corazones = el('span', { clase: 'juego__vidas', role: 'img' });
  const estado = crearEstadoEjercicio();
  contenedor.append(
    cabecera.elemento,
    el('div', { clase: 'juego__marcador' }, el('div', { clase: 'juego__marcador-bloque' }, el('span', { clase: 'juego__marcador-etiqueta', texto: TEXTOS.juego.puertas }), marcador), corazones),
    vista.elemento,
    estado,
  );

  let partida = null;
  let lector = null;
  let animacion = null;
  let ultimoTiempo = null;
  let ultimaNotaGuiada = null;
  let vozActual = null;
  let destruido = false;

  function pintarVidas(vidas) {
    corazones.replaceChildren(...Array.from({ length: VIDAS_INICIALES }, (_, i) => el('span', { clase: `juego__corazon ${i < vidas ? '' : 'juego__corazon--vacio'}`.trim() }, icono('corazon', { tamano: 22 }))));
    corazones.setAttribute('aria-label', `${TEXTOS.juego.vidas}: ${vidas}`);
  }

  function guiarNota(puerta) {
    if (!puerta || puerta === ultimaNotaGuiada) return;
    ultimaNotaGuiada = puerta;
    estado.textContent = TEXTOS.juego.siguienteNota(nombreNota(puerta.nota));
    audio.reproducirNota(puerta.nota, DURACION_NOTA_GUIA_SEGUNDOS, { ganancia: GANANCIA_ACOMPANAMIENTO });
  }

  function terminar() {
    lector?.detener();
    const superadas = partida.puertasSuperadas;
    const total = ejercicio.notas.length;
    alTerminar({
      puntuacion: Math.round((superadas / total) * PUNTUACION_MAXIMA),
      titulo: superadas === total ? T.perfecto : undefined,
      detalle: T.resultadoFormato(superadas, total),
    });
  }

  function bucle(ahora) {
    if (!partida || destruido) return;
    const dt = ultimoTiempo === null ? 0 : Math.min(PASO_MAXIMO_SEGUNDOS, (ahora - ultimoTiempo) / 1000);
    ultimoTiempo = ahora;
    fijarVoz(partida, vozActual);
    const eventos = avanzar(partida, dt);
    for (const evento of eventos) {
      if (evento.tipo === 'puerta') marcador.textContent = `${partida.puertasSuperadas}/${ejercicio.notas.length}`;
      if (evento.tipo === 'choque') pintarVidas(partida.vidas);
    }
    guiarNota(puertaSiguiente(partida));
    vista.dibujar(partida);
    if (partida.estado === 'terminada') {
      terminar();
      return;
    }
    animacion = requestAnimationFrame(bucle);
  }

  function comenzar() {
    fijarAcciones([]);
    const { ancho, alto } = vista.medidas();
    partida = crearPartida(ejercicio.rango, { ancho, alto, secuencia: ejercicio.notas });
    pintarVidas(VIDAS_INICIALES);
    lector = audio.crearLector((lectura) => {
      if (lectura.guia) return;
      vozActual = lectura.voz ? lectura.midi : null;
    });
    lector.iniciar();
    empezar(partida);
    animacion = requestAnimationFrame(bucle);
  }

  return {
    iniciar() {
      vista.montar(() => {});
      pintarVidas(VIDAS_INICIALES);
      estado.textContent = T.preparado;
      fijarAcciones([{ texto: TEXTOS.leccion.empezar, accion: comenzar }]);
    },
    destruir() {
      destruido = true;
      if (animacion !== null) cancelAnimationFrame(animacion);
      lector?.detener();
      vista.destruir();
    },
  };
}
