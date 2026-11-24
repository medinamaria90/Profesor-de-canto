// Pantalla del minijuego "Bola cantora": controla la partida con la voz y registra XP y récord.

import { el } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { icono } from '../componentes/iconos.js';
import { crearSolicitudMicrofono } from '../componentes/solicitud-microfono.js';
import { crearVistaBolaCantora } from '../../juegos/bola-cantora-vista.js';
import { crearPartida, empezar, fijarVoz, avanzar, puertaSiguiente, xpDePartida, VIDAS_INICIALES, X_BOLA_RELATIVA } from '../../juegos/bola-cantora-logica.js';
import { nombreNota } from '../../musica/notas.js';
import { GANANCIA_ACOMPANAMIENTO } from '../../audio/sintetizador.js';
import { TEXTOS } from '../../contenido/textos.js';
import { evaluarLogros, JUEGO_BOLA_CANTORA } from '../../contenido/logros.js';
import { obtenerEstado, actualizarEstado } from '../../estado/tienda.js';
import { fechaClave, rangoVocalEfectivo, registrarPartida, mejorPuntuacionJuego } from '../../estado/progreso.js';
import { audio } from '../../audio/servicio-audio.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.juego;
const PASO_MAXIMO_SEGUNDOS = 0.05;
const DURACION_NOTA_GUIA_SEGUNDOS = 0.5;

export function crearPantallaJuego() {
  const rango = rangoVocalEfectivo(obtenerEstado());
  const vista = crearVistaBolaCantora();
  const marcadorPuertas = el('span', { clase: 'juego__marcador-valor', texto: '0' });
  const corazones = el('span', { clase: 'juego__vidas', role: 'img', 'aria-label': `${T.vidas}: ${VIDAS_INICIALES}` });
  const siguiente = el('p', { clase: 'juego__siguiente', 'aria-live': 'polite' });
  const record = el('p', { clase: 'juego__record' });
  const capa = el('div', { clase: 'juego__capa' });
  const area = el('div', { clase: 'juego__area' });
  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-juego' },
    el('header', { clase: 'pantalla__cabecera' }, el('h1', { clase: 'pantalla__titulo', texto: T.titulo }), el('p', { clase: 'pantalla__subtitulo', texto: T.subtitulo })),
    area,
  );

  let partida = null;
  let lector = null;
  let animacion = null;
  let ultimoTiempo = null;
  let ultimaNotaGuiada = null;
  let vozActual = null;

  function pintarVidas(vidas) {
    corazones.replaceChildren(...Array.from({ length: VIDAS_INICIALES }, (_, i) => el('span', { clase: `juego__corazon ${i < vidas ? '' : 'juego__corazon--vacio'}`.trim() }, icono('corazon', { tamano: 22 }))));
    corazones.setAttribute('aria-label', `${T.vidas}: ${vidas}`);
  }

  function pintarRecord() {
    const mejor = mejorPuntuacionJuego(obtenerEstado(), JUEGO_BOLA_CANTORA);
    record.textContent = mejor > 0 ? T.recordFormato(mejor) : T.sinRecord;
  }

  function guiarNota(puerta) {
    if (!puerta || puerta.nota === ultimaNotaGuiada) return;
    ultimaNotaGuiada = puerta.nota;
    siguiente.textContent = T.siguienteNota(nombreNota(puerta.nota));
    audio.reproducirNota(puerta.nota, DURACION_NOTA_GUIA_SEGUNDOS, { ganancia: GANANCIA_ACOMPANAMIENTO });
  }

  function bucle(ahora) {
    if (!partida) return;
    const dt = ultimoTiempo === null ? 0 : Math.min(PASO_MAXIMO_SEGUNDOS, (ahora - ultimoTiempo) / 1000);
    ultimoTiempo = ahora;
    fijarVoz(partida, vozActual);
    const eventos = avanzar(partida, dt);
    for (const evento of eventos) {
      if (evento.tipo === 'puerta') marcadorPuertas.textContent = String(partida.puertasSuperadas);
      if (evento.tipo === 'choque') pintarVidas(partida.vidas);
    }
    guiarNota(puertaSiguiente(partida));
    vista.dibujar(partida);
    if (partida.estado === 'terminada') {
      terminarPartida();
      return;
    }
    animacion = requestAnimationFrame(bucle);
  }

  function nuevaPartida() {
    const { ancho, alto } = vista.medidas();
    partida = crearPartida(rango, { ancho, alto });
    vista.limpiarEstela();
    ultimaNotaGuiada = null;
    ultimoTiempo = null;
    marcadorPuertas.textContent = '0';
    pintarVidas(VIDAS_INICIALES);
    siguiente.textContent = T.preparado;
    capa.replaceChildren();
    capa.hidden = true;
    empezar(partida);
    vista.dibujar(partida);
    lector ??= audio.crearLector((lectura) => {
      vozActual = lectura.voz ? lectura.midi : null;
    });
    lector.iniciar();
    animacion = requestAnimationFrame(bucle);
  }

  function terminarPartida() {
    lector?.detener();
    vozActual = null;
    const puertas = partida.puertasSuperadas;
    const xp = xpDePartida(puertas);
    const hoy = fechaClave();
    const mejorAnterior = mejorPuntuacionJuego(obtenerEstado(), JUEGO_BOLA_CANTORA);
    actualizarEstado((estado) => evaluarLogros(registrarPartida(estado, { juegoId: JUEGO_BOLA_CANTORA, puntuacion: puertas, xp, hoy }), hoy).estado);
    pintarRecord();
    capa.hidden = false;
    capa.replaceChildren(
      el(
        'div',
        { clase: 'juego__fin tarjeta', role: 'dialog', 'aria-labelledby': 'juego-fin-titulo' },
        el('h2', { clase: 'juego__fin-titulo', id: 'juego-fin-titulo', texto: T.finTitulo }),
        puertas > mejorAnterior && puertas > 0 && el('p', { clase: 'juego__fin-record', texto: T.nuevoRecord }),
        el('p', { clase: 'juego__fin-puertas', texto: T.finPuertas(puertas) }),
        el('p', { clase: 'juego__fin-xp', texto: T.finXp(xp) }),
        crearBoton(T.otraVez, { ancho: true, onClick: nuevaPartida }),
        crearBoton(T.volver, { variante: 'texto', ancho: true, onClick: () => navegar('/') }),
      ),
    );
    capa.querySelector('button')?.focus();
  }

  function arrancar() {
    area.replaceChildren(
      el(
        'div',
        { clase: 'juego__marcador' },
        el('div', { clase: 'juego__marcador-bloque' }, el('span', { clase: 'juego__marcador-etiqueta', texto: T.puertas }), marcadorPuertas),
        corazones,
      ),
      el('div', { clase: 'juego__tablero' }, vista.elemento, capa),
      siguiente,
      record,
    );
    pintarVidas(VIDAS_INICIALES);
    pintarRecord();
    siguiente.textContent = T.preparado;
    capa.replaceChildren(el('div', { clase: 'juego__fin tarjeta' }, crearBoton(T.jugar, { ancho: true, onClick: nuevaPartida })));
    vista.montar(() => {
      if (partida) {
        const { ancho, alto } = vista.medidas();
        partida.ancho = ancho;
        partida.alto = alto;
        partida.bola.x = ancho * X_BOLA_RELATIVA;
      }
    });
  }

  return {
    elemento,
    montado() {
      audio.preparar().catch((error) => console.warn('No se pudo activar el audio aún.', error));
      const mostrarSolicitud = () => area.replaceChildren(crearSolicitudMicrofono({ alListo: arrancar }).elemento);
      if (audio.tieneEntrada()) arrancar();
      else audio.puedeAbrirSinPreguntar().then((sinPreguntar) => (sinPreguntar ? audio.abrirEntrada().then(arrancar).catch(mostrarSolicitud) : mostrarSolicitud()));
    },
    destruir() {
      if (animacion !== null) cancelAnimationFrame(animacion);
      partida = null;
      lector?.detener();
      audio.cerrarEntrada();
      vista.destruir();
      audio.detenerTodo();
    },
  };
}
