// Reto: la alondra vuela por una canción al ritmo real. Las puertas son las notas (anchas lo que dura cada una),
// suena el piano con la canción y un pulso de percusión marca el tempo. El tiempo del juego es el del audio.

import { el } from '../ui/dom.js';
import { icono } from '../ui/componentes/iconos.js';
import { crearVistaBolaCantora } from '../juegos/bola-cantora-vista.js';
import { crearPartida, empezar, fijarVoz, avanzar, puertaSiguiente, VIDAS_INICIALES } from '../juegos/bola-cantora-logica.js';
import { nombreNota } from '../musica/notas.js';
import { segundosPorPulso } from '../musica/tempo.js';
import { audio } from '../audio/servicio-audio.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio } from './comun.js';
import { PUNTUACION_MAXIMA } from './puntuacion.js';
import { TEXTOS } from '../contenido/textos.js';

const T = TEXTOS.ejercicios.reto;
const PASO_MAXIMO_SEGUNDOS = 0.5;
const RETARDO_INICIO_SEGUNDOS = 0.2;
// Cuánto avanza el escenario por cada pulso de la canción.
const PIXELES_POR_PULSO = 130;
const GANANCIA_ACOMPANAMIENTO = 0.8;
const GANANCIA_MELODIA = 0.12;

export function crearEjercicioReto(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const cabecera = crearCabeceraEjercicio(T.titulo, T.instruccion(ejercicio.titulo));
  const vista = crearVistaBolaCantora();
  const total = ejercicio.partitura.filter((nota) => nota.puerta).length;
  const marcador = el('span', { clase: 'juego__marcador-valor', texto: `0/${total}` });
  const corazones = el('span', { clase: 'juego__vidas', role: 'img' });
  const estado = crearEstadoEjercicio();
  contenedor.append(
    cabecera.elemento,
    el('div', { clase: 'juego__marcador' }, el('div', { clase: 'juego__marcador-bloque' }, el('span', { clase: 'juego__marcador-etiqueta', texto: TEXTOS.juego.puertas }), marcador), corazones),
    vista.elemento,
    estado,
  );

  const pulso = segundosPorPulso(ejercicio.tempo);
  const { pulsosPorCompas, anacrusa, compases } = ejercicio.acompanamiento;
  // Un compás de entrada con pulso antes de la primera nota (menos la anacrusa, que ya es canción).
  const entradaSegundos = (pulsosPorCompas - anacrusa) * pulso;
  const velocidad = PIXELES_POR_PULSO / pulso;

  let partida = null;
  let lector = null;
  let animacion = null;
  let inicioAudio = null;
  let ultimaPuertaAnunciada = null;
  let vozActual = null;
  let destruido = false;

  function pintarVidas(vidas) {
    corazones.replaceChildren(...Array.from({ length: VIDAS_INICIALES }, (_, i) => el('span', { clase: `juego__corazon ${i < vidas ? '' : 'juego__corazon--vacio'}`.trim() }, icono('corazon', { tamano: 22 }))));
    corazones.setAttribute('aria-label', `${TEXTOS.juego.vidas}: ${vidas}`);
  }

  function anunciarNota(puerta) {
    if (!puerta || puerta === ultimaPuertaAnunciada) return;
    ultimaPuertaAnunciada = puerta;
    estado.textContent = TEXTOS.juego.siguienteNota(nombreNota(puerta.nota));
  }

  // Piano con la canción, melodía de fondo y un clic en cada pulso (acentuado al empezar el compás).
  function programarMusica() {
    const pulsosTotales = pulsosPorCompas + compases * pulsosPorCompas;
    for (let indice = 0; indice < pulsosTotales; indice++) audio.clickMetronomo(inicioAudio + indice * pulso, indice % pulsosPorCompas === 0);
    audio.reproducirAcompanamiento(ejercicio.acompanamiento, { cuando: inicioAudio + pulsosPorCompas * pulso, ganancia: GANANCIA_ACOMPANAMIENTO });
    audio.reproducirSecuencia(ejercicio.notas, ejercicio.tempo, { cuando: inicioAudio + entradaSegundos, instrumento: 'piano', ganancia: GANANCIA_MELODIA });
  }

  // Sin vidas, el vuelo no vale: cero y a repetir. Con vidas, cuentan las puertas superadas.
  function terminar() {
    lector?.detener();
    audio.detenerTodo();
    const superadas = partida.puertasSuperadas;
    const caida = partida.vidas <= 0;
    alTerminar({
      puntuacion: caida ? 0 : Math.round((superadas / total) * PUNTUACION_MAXIMA),
      titulo: caida ? T.caida : superadas === total ? T.perfecto : undefined,
      detalle: T.resultadoFormato(superadas, total),
      repetir: comenzar,
      textoRepetir: TEXTOS.leccion.otraVez,
    });
  }

  function bucle() {
    if (!partida || destruido) return;
    const tiempo = audio.ahora() - inicioAudio;
    const dt = Math.max(0, Math.min(PASO_MAXIMO_SEGUNDOS, tiempo - partida.tiempo));
    fijarVoz(partida, vozActual);
    const eventos = avanzar(partida, dt);
    for (const evento of eventos) {
      if (evento.tipo === 'puerta') marcador.textContent = `${partida.puertasSuperadas}/${total}`;
      if (evento.tipo === 'choque') pintarVidas(partida.vidas);
    }
    anunciarNota(puertaSiguiente(partida));
    vista.dibujar(partida);
    if (partida.estado === 'terminada') {
      terminar();
      return;
    }
    animacion = requestAnimationFrame(bucle);
  }

  async function comenzar() {
    fijarAcciones([]);
    await audio.prepararPiano();
    if (destruido) return;
    marcador.textContent = `0/${total}`;
    ultimaPuertaAnunciada = null;
    vozActual = null;
    const { ancho, alto } = vista.medidas();
    const partitura = ejercicio.partitura.map((nota) => ({ midi: nota.midi, inicio: entradaSegundos + nota.inicio * pulso, duracion: nota.duracion * pulso }));
    partida = crearPartida(ejercicio.rango, { ancho, alto, partitura, velocidad });
    pintarVidas(VIDAS_INICIALES);
    lector = audio.crearLector((lectura) => {
      if (lectura.guia) return;
      vozActual = lectura.voz ? lectura.midi : null;
    });
    lector.iniciar();
    inicioAudio = audio.ahora() + RETARDO_INICIO_SEGUNDOS;
    programarMusica();
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
      audio.detenerTodo();
      vista.destruir();
    },
  };
}
