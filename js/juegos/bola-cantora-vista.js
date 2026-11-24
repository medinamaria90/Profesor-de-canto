// Vista lateral del "Vuelo de la alondra": cielo con profundidad (sol, colinas y nubes en paralaje),
// puertas con cartel de nota, la alondra batiendo las alas y una estela de plumas. Solo pinta: la partida
// la mueve la lógica pura (que sigue hablando de "bola": es la posición de la alondra).

import { el, crearPaleta, ajustarCanvas } from '../ui/dom.js';
import { nombreNota } from '../musica/notas.js';
import { ANCHO_PUERTA, huecoDePuerta, xDePuerta, puertaSiguiente } from './bola-cantora-logica.js';
import { dibujarAlondra } from './dibujar-alondra.js';

const TAMANO_ALONDRA = 52;
const LONGITUD_ESTELA = 16;
const RADIO_ESQUINA_PUERTA = 10;
const FRECUENCIA_PARPADEO = 12;
const OPACIDAD_GUIA = 0.4;
const PARTICULAS_POR_PUERTA = 14;
const VIDA_PARTICULA_SEGUNDOS = 0.7;
const VELOCIDAD_PARTICULA = 110;
const VELOCIDAD_COLINAS = 0.25;
const VELOCIDAD_NUBES = 0.5;
const NUBES = [
  { x: 60, y: 0.18, tamano: 26 }, { x: 260, y: 0.1, tamano: 34 }, { x: 470, y: 0.24, tamano: 22 }, { x: 700, y: 0.14, tamano: 30 }, { x: 930, y: 0.2, tamano: 24 },
];
const ANCHO_CIELO = 1100;
const ALTO_COLINAS_RELATIVO = 0.22;
const INCLINACION_POR_VELOCIDAD = 0.0025;

export function crearVistaBolaCantora() {
  const canvas = el('canvas', { clase: 'juego__canvas' });
  const elemento = el('div', { clase: 'juego__escenario' }, canvas);
  const estela = [];
  const particulas = [];
  let observador = null;
  let ultimasSuperadas = 0;
  let yAnterior = null;

  const paletaCss = crearPaleta({
    cieloArriba: '--juego-cielo',
    cieloAbajo: '--juego-suelo',
    sol: '--juego-astro',
    colinaLejos: '--juego-colina-lejos',
    colinaCerca: '--juego-colina-cerca',
    nube: '--juego-nube',
    puerta: '--primario',
    puertaSiguiente: '--secundario',
    puertaSuperada: '--acierto',
    puertaChocada: '--error',
    cartel: '--superficie',
    cartelTexto: '--sobre-superficie',
    guia: '--primario',
    pluma: '--alondra-ala',
    cuerpo: '--alondra-cuerpo',
    vientre: '--alondra-vientre',
    ala: '--alondra-ala',
    pico: '--alondra-pico',
    ojo: '--sobre-superficie',
    brillo: '--sobre-primario',
    particula: '--secundario',
  });
  const colores = () => paletaCss.obtener();

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

  function dibujarCielo(contexto, paleta, ancho, alto, partida) {
    const degradado = contexto.createLinearGradient(0, 0, 0, alto);
    degradado.addColorStop(0, paleta.cieloArriba);
    degradado.addColorStop(1, paleta.cieloAbajo);
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, ancho, alto);

    // Sol.
    contexto.fillStyle = paleta.sol;
    contexto.globalAlpha = 0.9;
    contexto.beginPath();
    contexto.arc(ancho * 0.8, alto * 0.22, Math.min(ancho, alto) * 0.09, 0, Math.PI * 2);
    contexto.fill();
    contexto.globalAlpha = 1;

    // Nubes en paralaje.
    const avanceNubes = (partida.desplazamiento * VELOCIDAD_NUBES) % ANCHO_CIELO;
    contexto.fillStyle = paleta.nube;
    for (const nube of NUBES) {
      const x = ((nube.x - avanceNubes) % ANCHO_CIELO + ANCHO_CIELO) % ANCHO_CIELO - 60;
      const y = alto * nube.y;
      const r = nube.tamano;
      contexto.beginPath();
      contexto.arc(x, y, r, 0, Math.PI * 2);
      contexto.arc(x + r * 0.9, y - r * 0.4, r * 0.8, 0, Math.PI * 2);
      contexto.arc(x + r * 1.8, y, r * 0.9, 0, Math.PI * 2);
      contexto.arc(x + r * 0.9, y + r * 0.3, r * 0.9, 0, Math.PI * 2);
      contexto.fill();
    }

    // Colinas en dos planos.
    dibujarColinas(contexto, paleta.colinaLejos, ancho, alto, partida.desplazamiento * VELOCIDAD_COLINAS, 0.3, 140);
    dibujarColinas(contexto, paleta.colinaCerca, ancho, alto, partida.desplazamiento * VELOCIDAD_COLINAS * 1.8, 0.55, 90);
  }

  function dibujarColinas(contexto, color, ancho, alto, avance, amplitud, periodo) {
    const base = alto * (1 - ALTO_COLINAS_RELATIVO);
    contexto.fillStyle = color;
    contexto.beginPath();
    contexto.moveTo(0, alto);
    for (let x = 0; x <= ancho; x += 8) {
      const fase = (x + avance) / periodo;
      const y = base + Math.sin(fase) * alto * ALTO_COLINAS_RELATIVO * amplitud * 0.5 + Math.sin(fase * 0.37) * alto * 0.03;
      contexto.lineTo(x, y);
    }
    contexto.lineTo(ancho, alto);
    contexto.closePath();
    contexto.fill();
  }

  function dibujarPuertas(contexto, paleta, partida, ancho) {
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
      if (puerta === siguiente) {
        contexto.shadowColor = color;
        contexto.shadowBlur = 16;
      }
      rectanguloRedondeado(contexto, x, -RADIO_ESQUINA_PUERTA, ANCHO_PUERTA, hueco.arriba + RADIO_ESQUINA_PUERTA, RADIO_ESQUINA_PUERTA);
      contexto.fill();
      rectanguloRedondeado(contexto, x, hueco.abajo, ANCHO_PUERTA, partida.alto - hueco.abajo + RADIO_ESQUINA_PUERTA, RADIO_ESQUINA_PUERTA);
      contexto.fill();
      contexto.shadowBlur = 0;
      // Cartel con la nota, centrado en el hueco y siempre dentro del cuadro.
      const anchoCartel = 44;
      const altoCartel = 22;
      const yCartel = Math.min(partida.alto - altoCartel - 4, Math.max(4, hueco.centro - altoCartel / 2));
      contexto.fillStyle = paleta.cartel;
      rectanguloRedondeado(contexto, x + ANCHO_PUERTA / 2 - anchoCartel / 2, yCartel, anchoCartel, altoCartel, 6);
      contexto.fill();
      contexto.fillStyle = paleta.cartelTexto;
      contexto.fillText(nombreNota(puerta.nota, false), x + ANCHO_PUERTA / 2, yCartel + altoCartel / 2);
    }
  }

  function dibujarGuia(contexto, paleta, partida, ancho) {
    if (partida.alturaObjetivo === null) return;
    const y = partida.alto - partida.alturaObjetivo * partida.alto;
    contexto.strokeStyle = paleta.guia;
    contexto.globalAlpha = OPACIDAD_GUIA;
    contexto.lineWidth = 2;
    contexto.setLineDash([6, 8]);
    contexto.beginPath();
    contexto.moveTo(0, y);
    contexto.lineTo(ancho, y);
    contexto.stroke();
    contexto.setLineDash([]);
    contexto.globalAlpha = 1;
  }

  function dibujarEstela(contexto, paleta, partida) {
    const bola = partida.bola;
    estela.push({ x: bola.x, y: bola.y });
    if (estela.length > LONGITUD_ESTELA) estela.shift();
    const pasoX = partida.velocidad / 60;
    estela.forEach((punto, indice) => {
      const fraccion = (indice + 1) / estela.length;
      contexto.globalAlpha = fraccion * 0.45;
      contexto.fillStyle = paleta.pluma;
      contexto.beginPath();
      contexto.ellipse(bola.x - (estela.length - indice) * pasoX - 22, punto.y + 4, 7 * fraccion + 2, 3 * fraccion + 1, -0.3, 0, Math.PI * 2);
      contexto.fill();
    });
    contexto.globalAlpha = 1;
  }

  function emitirParticulas(partida) {
    for (let i = 0; i < PARTICULAS_POR_PUERTA; i++) {
      const angulo = (i / PARTICULAS_POR_PUERTA) * Math.PI * 2;
      particulas.push({ x: partida.bola.x, y: partida.bola.y, vx: Math.cos(angulo) * VELOCIDAD_PARTICULA, vy: Math.sin(angulo) * VELOCIDAD_PARTICULA, nacimiento: partida.tiempo });
    }
  }

  function dibujarParticulas(contexto, paleta, partida) {
    contexto.fillStyle = paleta.particula;
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      const edad = partida.tiempo - p.nacimiento;
      if (edad > VIDA_PARTICULA_SEGUNDOS) {
        particulas.splice(i, 1);
        continue;
      }
      contexto.globalAlpha = 1 - edad / VIDA_PARTICULA_SEGUNDOS;
      contexto.beginPath();
      contexto.arc(p.x + p.vx * edad - partida.velocidad * edad, p.y + p.vy * edad, 4, 0, Math.PI * 2);
      contexto.fill();
    }
    contexto.globalAlpha = 1;
  }

  function dibujarPersonaje(contexto, paleta, partida) {
    const bola = partida.bola;
    const velocidadY = yAnterior === null ? 0 : bola.y - yAnterior;
    yAnterior = bola.y;
    const invulnerable = partida.tiempo < partida.invulnerableHasta;
    if (invulnerable && Math.floor(partida.tiempo * FRECUENCIA_PARPADEO) % 2 === 0) contexto.globalAlpha = 0.4;
    dibujarAlondra(contexto, bola.x, bola.y, {
      tamano: TAMANO_ALONDRA,
      inclinacion: velocidadY * INCLINACION_POR_VELOCIDAD * 60,
      fase: partida.tiempo,
      paleta,
      resplandor: partida.alturaObjetivo === null ? null : paleta.particula,
    });
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
      dibujarCielo(contexto, paleta, ancho, alto, partida);
      dibujarGuia(contexto, paleta, partida, ancho);
      dibujarPuertas(contexto, paleta, partida, ancho);
      if (partida.puertasSuperadas > ultimasSuperadas) emitirParticulas(partida);
      ultimasSuperadas = partida.puertasSuperadas;
      dibujarParticulas(contexto, paleta, partida);
      dibujarEstela(contexto, paleta, partida);
      dibujarPersonaje(contexto, paleta, partida);
    },
    limpiarEstela() {
      estela.length = 0;
      particulas.length = 0;
      ultimasSuperadas = 0;
      yAnterior = null;
    },
    montar(alRedimensionar) {
      observador = new ResizeObserver(() => alRedimensionar());
      observador.observe(canvas);
    },
    destruir() {
      observador?.disconnect();
      paletaCss.destruir();
    },
  };
}
