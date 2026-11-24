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
// Ciclo de día completo (día → tarde → noche → amanecer → día) mientras se juega.
const CICLO_DIA_SEGUNDOS = 120;
const FASES_DIA = [
  { en: 0, nombre: 'dia' },
  { en: 0.33, nombre: 'tarde' },
  { en: 0.5, nombre: 'noche' },
  { en: 0.8, nombre: 'amanecer' },
  { en: 1, nombre: 'dia' },
];
const CLAVES_FASE = ['cieloAlto', 'cieloBajo', 'astro', 'colinaLejos', 'colinaCerca', 'nube'];
const ESTRELLAS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97) % 1000 / 1000, y: ((i * 61) % 100) / 100 * 0.6, r: 1 + (i % 3) * 0.6 }));

function hexARgb(hex) {
  const limpio = hex.trim().replace('#', '');
  const valor = parseInt(limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio, 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

function mezclarHex(a, b, t) {
  const ca = hexARgb(a);
  const cb = hexARgb(b);
  const c = ca.map((valor, i) => Math.round(valor + (cb[i] - valor) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Devuelve los colores del escenario para un instante del ciclo, mezclando las dos fases vecinas.
function coloresDelMomento(fases, tiempo) {
  const fraccion = (tiempo % CICLO_DIA_SEGUNDOS) / CICLO_DIA_SEGUNDOS;
  let i = 0;
  while (i < FASES_DIA.length - 2 && fraccion >= FASES_DIA[i + 1].en) i++;
  const desde = FASES_DIA[i];
  const hasta = FASES_DIA[i + 1];
  const t = (fraccion - desde.en) / (hasta.en - desde.en);
  const resultado = {};
  for (const clave of CLAVES_FASE) resultado[clave] = mezclarHex(fases[desde.nombre][clave], fases[hasta.nombre][clave], t);
  // Intensidad de la noche (para las estrellas): 1 en plena noche, 0 de día.
  const noche = { dia: 0, tarde: 0, noche: 1, amanecer: 0 };
  resultado.noche = noche[desde.nombre] + (noche[hasta.nombre] - noche[desde.nombre]) * t;
  return resultado;
}

export function crearVistaBolaCantora() {
  const canvas = el('canvas', { clase: 'juego__canvas' });
  const elemento = el('div', { clase: 'juego__escenario' }, canvas);
  const estela = [];
  const particulas = [];
  let observador = null;
  let ultimasSuperadas = 0;
  let yAnterior = null;

  const nombresFase = {};
  for (const fase of ['dia', 'tarde', 'noche', 'amanecer']) {
    nombresFase[`${fase}CieloAlto`] = `--juego-${fase}-cielo-alto`;
    nombresFase[`${fase}CieloBajo`] = `--juego-${fase}-cielo-bajo`;
    nombresFase[`${fase}Astro`] = `--juego-${fase}-astro`;
    nombresFase[`${fase}ColinaLejos`] = `--juego-${fase}-colina-lejos`;
    nombresFase[`${fase}ColinaCerca`] = `--juego-${fase}-colina-cerca`;
    nombresFase[`${fase}Nube`] = `--juego-${fase}-nube`;
  }
  const paletaCss = crearPaleta({
    ...nombresFase,
    estrella: '--juego-estrella',
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

  function fasesDeLaPaleta(paleta) {
    const fases = {};
    for (const fase of ['dia', 'tarde', 'noche', 'amanecer']) {
      fases[fase] = {
        cieloAlto: paleta[`${fase}CieloAlto`],
        cieloBajo: paleta[`${fase}CieloBajo`],
        astro: paleta[`${fase}Astro`],
        colinaLejos: paleta[`${fase}ColinaLejos`],
        colinaCerca: paleta[`${fase}ColinaCerca`],
        nube: paleta[`${fase}Nube`],
      };
    }
    return fases;
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

  function dibujarCielo(contexto, paleta, ancho, alto, partida) {
    const momento = coloresDelMomento(fasesDeLaPaleta(paleta), partida.tiempo);
    const degradado = contexto.createLinearGradient(0, 0, 0, alto);
    degradado.addColorStop(0, momento.cieloAlto);
    degradado.addColorStop(1, momento.cieloBajo);
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, ancho, alto);

    // Estrellas, solo de noche.
    if (momento.noche > 0.05) {
      contexto.fillStyle = paleta.estrella;
      contexto.globalAlpha = momento.noche * 0.9;
      for (const estrella of ESTRELLAS) {
        contexto.beginPath();
        contexto.arc(estrella.x * ancho, estrella.y * alto, estrella.r, 0, Math.PI * 2);
        contexto.fill();
      }
      contexto.globalAlpha = 1;
    }

    // Sol o luna: recorre el cielo a lo largo del ciclo.
    const fraccionCiclo = (partida.tiempo % CICLO_DIA_SEGUNDOS) / CICLO_DIA_SEGUNDOS;
    const xAstro = ancho * (0.15 + 0.7 * ((fraccionCiclo * 2) % 1));
    const yAstro = alto * (0.18 + 0.12 * Math.abs(((fraccionCiclo * 2) % 1) - 0.5) * 2);
    contexto.fillStyle = momento.astro;
    contexto.shadowColor = momento.astro;
    contexto.shadowBlur = 30;
    contexto.beginPath();
    contexto.arc(xAstro, yAstro, Math.min(ancho, alto) * 0.08, 0, Math.PI * 2);
    contexto.fill();
    contexto.shadowBlur = 0;

    // Nubes en paralaje.
    const avanceNubes = (partida.desplazamiento * VELOCIDAD_NUBES) % ANCHO_CIELO;
    contexto.fillStyle = momento.nube;
    contexto.globalAlpha = 0.85;
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
    contexto.globalAlpha = 1;

    // Colinas en dos planos.
    dibujarColinas(contexto, momento.colinaLejos, ancho, alto, partida.desplazamiento * VELOCIDAD_COLINAS, 0.3, 140);
    dibujarColinas(contexto, momento.colinaCerca, ancho, alto, partida.desplazamiento * VELOCIDAD_COLINAS * 1.8, 0.55, 90);
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
