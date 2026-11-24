// Dibujo en canvas del minijuego "Bola cantora". Solo pinta: la partida la mueve la lógica pura.

import { el, leerVariableCss, ajustarCanvas } from '../ui/dom.js';
import { nombreNota } from '../musica/notas.js';
import { ANCHO_PUERTA, RADIO_BOLA, huecoDePuerta, xDePuerta, puertaSiguiente } from './bola-cantora-logica.js';

const LONGITUD_ESTELA = 18;
const RADIO_ESQUINA_PUERTA = 8;
const FRECUENCIA_PARPADEO = 12;
const OPACIDAD_GUIA = 0.45;

export function crearVistaBolaCantora() {
  const canvas = el('canvas', { clase: 'juego__canvas' });
  const elemento = el('div', { clase: 'juego__escenario' }, canvas);
  const estela = [];
  let observador = null;

  function colores() {
    return {
      fondoArriba: leerVariableCss('--superficie-1'),
      fondoAbajo: leerVariableCss('--superficie-3'),
      puerta: leerVariableCss('--primario'),
      puertaSiguiente: leerVariableCss('--secundario'),
      puertaSuperada: leerVariableCss('--acierto'),
      puertaChocada: leerVariableCss('--error'),
      etiqueta: leerVariableCss('--sobre-superficie'),
      bola: leerVariableCss('--racha'),
      bolaBrillo: leerVariableCss('--sobre-primario'),
      estela: leerVariableCss('--racha-contenedor'),
      linea: leerVariableCss('--primario'),
    };
  }

  function rectanguloRedondeado(contexto, x, y, ancho, alto, radio) {
    const r = Math.min(radio, ancho / 2, Math.abs(alto) / 2);
    contexto.beginPath();
    contexto.moveTo(x + r, y);
    contexto.arcTo(x + ancho, y, x + ancho, y + alto, r);
    contexto.arcTo(x + ancho, y + alto, x, y + alto, r);
    contexto.arcTo(x, y + alto, x, y, r);
    contexto.arcTo(x, y, x + ancho, y, r);
    contexto.closePath();
  }

  function dibujarPuertas(contexto, partida, paleta, ancho) {
    const siguiente = puertaSiguiente(partida);
    contexto.font = '600 14px system-ui, sans-serif';
    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';
    for (const puerta of partida.puertas) {
      const x = xDePuerta(partida, puerta);
      if (x > ancho || x + ANCHO_PUERTA < 0) continue;
      const hueco = huecoDePuerta(partida, puerta);
      let color = paleta.puerta;
      if (puerta.superada) color = paleta.puertaSuperada;
      else if (puerta.chocada) color = paleta.puertaChocada;
      else if (puerta === siguiente) color = paleta.puertaSiguiente;
      contexto.fillStyle = color;
      rectanguloRedondeado(contexto, x, -RADIO_ESQUINA_PUERTA, ANCHO_PUERTA, hueco.arriba + RADIO_ESQUINA_PUERTA, RADIO_ESQUINA_PUERTA);
      contexto.fill();
      rectanguloRedondeado(contexto, x, hueco.abajo, ANCHO_PUERTA, partida.alto - hueco.abajo + RADIO_ESQUINA_PUERTA, RADIO_ESQUINA_PUERTA);
      contexto.fill();
      contexto.fillStyle = paleta.etiqueta;
      contexto.fillText(nombreNota(puerta.nota, false), x + ANCHO_PUERTA / 2, hueco.centro);
    }
  }

  function dibujarBola(contexto, partida, paleta) {
    const bola = partida.bola;
    estela.push({ x: bola.x, y: bola.y });
    if (estela.length > LONGITUD_ESTELA) estela.shift();
    estela.forEach((punto, indice) => {
      const fraccion = (indice + 1) / estela.length;
      contexto.globalAlpha = fraccion * 0.5;
      contexto.fillStyle = paleta.estela;
      contexto.beginPath();
      contexto.arc(bola.x - (estela.length - indice) * (partida.velocidad / 60), punto.y, RADIO_BOLA * fraccion * 0.8, 0, Math.PI * 2);
      contexto.fill();
    });
    contexto.globalAlpha = 1;
    const invulnerable = partida.tiempo < partida.invulnerableHasta;
    if (invulnerable && Math.floor(partida.tiempo * FRECUENCIA_PARPADEO) % 2 === 0) contexto.globalAlpha = 0.35;
    contexto.fillStyle = paleta.bola;
    contexto.beginPath();
    contexto.arc(bola.x, bola.y, RADIO_BOLA, 0, Math.PI * 2);
    contexto.fill();
    contexto.fillStyle = paleta.bolaBrillo;
    contexto.beginPath();
    contexto.arc(bola.x - RADIO_BOLA * 0.35, bola.y - RADIO_BOLA * 0.35, RADIO_BOLA * 0.3, 0, Math.PI * 2);
    contexto.fill();
    contexto.globalAlpha = 1;
  }

  function dibujarGuia(contexto, partida, paleta, ancho) {
    if (partida.alturaObjetivo === null) return;
    const y = partida.alto - partida.alturaObjetivo * partida.alto;
    contexto.strokeStyle = paleta.linea;
    contexto.globalAlpha = OPACIDAD_GUIA;
    contexto.lineWidth = 2;
    contexto.setLineDash([6, 6]);
    contexto.beginPath();
    contexto.moveTo(0, y);
    contexto.lineTo(ancho, y);
    contexto.stroke();
    contexto.setLineDash([]);
    contexto.globalAlpha = 1;
  }

  return {
    elemento,
    medidas() {
      const { width, height } = canvas.getBoundingClientRect();
      return { ancho: width, alto: height };
    },
    dibujar(partida) {
      const { contexto, ancho, alto } = ajustarCanvas(canvas);
      const paleta = colores();
      const degradado = contexto.createLinearGradient(0, 0, 0, alto);
      degradado.addColorStop(0, paleta.fondoArriba);
      degradado.addColorStop(1, paleta.fondoAbajo);
      contexto.fillStyle = degradado;
      contexto.fillRect(0, 0, ancho, alto);
      dibujarGuia(contexto, partida, paleta, ancho);
      dibujarPuertas(contexto, partida, paleta, ancho);
      dibujarBola(contexto, partida, paleta);
    },
    limpiarEstela() {
      estela.length = 0;
    },
    montar(alRedimensionar) {
      observador = new ResizeObserver(() => alRedimensionar());
      observador.observe(canvas);
    },
    destruir() {
      observador?.disconnect();
    },
  };
}
