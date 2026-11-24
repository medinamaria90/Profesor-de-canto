// Dibujo en primera persona del minijuego "Bola cantora": las puertas vienen hacia ti desde el fondo,
// la bola es grande y brilla, y un túnel de líneas da sensación de velocidad. Solo pinta: la partida
// la mueve la lógica pura (que sigue trabajando en 2D: distancia horizontal = profundidad).

import { el, crearPaleta, ajustarCanvas } from '../ui/dom.js';
import { nombreNota } from '../musica/notas.js';
import { ANCHO_PUERTA, huecoDePuerta, xDePuerta, puertaSiguiente } from './bola-cantora-logica.js';

// Distancia focal de la perspectiva: cuanto mayor, menos "ojo de pez".
const FOCAL = 260;
const RADIO_BOLA_PANTALLA = 26;
const LONGITUD_ESTELA = 14;
const LINEAS_TUNEL = 10;
const SEPARACION_LINEAS_TUNEL = 90;
const FRECUENCIA_PARPADEO = 12;
const OPACIDAD_GUIA = 0.35;
const GROSOR_MARCO = 14;
const PARTICULAS_POR_PUERTA = 12;
const VIDA_PARTICULA_SEGUNDOS = 0.6;
const VELOCIDAD_PARTICULA = 90;
const DISTANCIA_DESVANECER = ANCHO_PUERTA * 3;

export function crearVistaBolaCantora() {
  const canvas = el('canvas', { clase: 'juego__canvas' });
  const elemento = el('div', { clase: 'juego__escenario' }, canvas);
  const estela = [];
  const particulas = [];
  let observador = null;
  let ultimasSuperadas = 0;

  const paletaCss = crearPaleta({
    fondoArriba: '--juego-cielo',
    fondoAbajo: '--juego-suelo',
    tunel: '--juego-tunel',
    puerta: '--primario',
    puertaSiguiente: '--secundario',
    puertaSuperada: '--acierto',
    puertaChocada: '--error',
    etiqueta: '--sobre-primario',
    bola: '--racha',
    bolaBorde: '--racha-contenedor',
    brillo: '--sobre-primario',
    guia: '--primario',
  });
  const colores = () => paletaCss.obtener();

  // Escala de un objeto a `distancia` píxeles por delante de la bola (0 = en el plano de la bola).
  function escala(distancia) {
    return FOCAL / (FOCAL + Math.max(0, distancia));
  }

  function dibujarFondo(contexto, paleta, ancho, alto, partida) {
    const degradado = contexto.createLinearGradient(0, 0, 0, alto);
    degradado.addColorStop(0, paleta.fondoArriba);
    degradado.addColorStop(1, paleta.fondoAbajo);
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, ancho, alto);

    const cx = ancho / 2;
    const cy = alto / 2;
    contexto.strokeStyle = paleta.tunel;
    contexto.lineWidth = 1;
    const avance = partida.desplazamiento % SEPARACION_LINEAS_TUNEL;
    for (let i = 0; i < LINEAS_TUNEL; i++) {
      const distancia = i * SEPARACION_LINEAS_TUNEL - avance + SEPARACION_LINEAS_TUNEL;
      const s = escala(distancia);
      contexto.globalAlpha = 0.5 * s;
      contexto.strokeRect(cx - (ancho / 2) * s, cy - (alto / 2) * s, ancho * s, alto * s);
    }
    contexto.beginPath();
    for (const [x, y] of [[0, 0], [ancho, 0], [0, alto], [ancho, alto]]) {
      contexto.moveTo(x, y);
      contexto.lineTo(cx, cy);
    }
    contexto.globalAlpha = 0.25;
    contexto.stroke();
    contexto.globalAlpha = 1;
  }

  function dibujarPuerta(contexto, paleta, partida, puerta, ancho, alto, esSiguiente) {
    const distancia = xDePuerta(partida, puerta) - partida.bola.x;
    if (distancia < -DISTANCIA_DESVANECER) return;
    const s = escala(distancia);
    const cx = ancho / 2;
    const cy = alto / 2;
    const anchoMarco = ancho * s;
    const altoMarco = alto * s;
    const x0 = cx - anchoMarco / 2;
    const y0 = cy - altoMarco / 2;
    const hueco = huecoDePuerta(partida, puerta);
    const yArriba = cy + (hueco.arriba - alto / 2) * s;
    const yAbajo = cy + (hueco.abajo - alto / 2) * s;
    let color = paleta.puerta;
    if (puerta.superada) color = paleta.puertaSuperada;
    else if (puerta.chocada) color = paleta.puertaChocada;
    else if (esSiguiente) color = paleta.puertaSiguiente;

    contexto.globalAlpha = distancia < 0 ? Math.max(0, 1 + distancia / DISTANCIA_DESVANECER) : Math.min(1, 0.35 + s);
    contexto.fillStyle = color;
    contexto.fillRect(x0, y0, anchoMarco, Math.max(0, yArriba - y0));
    contexto.fillRect(x0, yAbajo, anchoMarco, Math.max(0, y0 + altoMarco - yAbajo));
    contexto.fillRect(x0, y0, GROSOR_MARCO * s, altoMarco);
    contexto.fillRect(x0 + anchoMarco - GROSOR_MARCO * s, y0, GROSOR_MARCO * s, altoMarco);

    if (s > 0.3 && !puerta.superada && !puerta.chocada) {
      contexto.fillStyle = paleta.etiqueta;
      contexto.font = `600 ${Math.round(16 + 18 * s)}px system-ui, sans-serif`;
      contexto.textAlign = 'center';
      contexto.textBaseline = 'middle';
      contexto.fillText(nombreNota(puerta.nota, false), cx, Math.max(yArriba - 14 * s, y0 + 14 * s));
    }
    contexto.globalAlpha = 1;
  }

  function dibujarGuia(contexto, paleta, partida, ancho, alto) {
    if (partida.alturaObjetivo === null) return;
    const y = alto - partida.alturaObjetivo * alto;
    contexto.strokeStyle = paleta.guia;
    contexto.globalAlpha = OPACIDAD_GUIA;
    contexto.lineWidth = 2;
    contexto.setLineDash([8, 8]);
    contexto.beginPath();
    contexto.moveTo(0, y);
    contexto.lineTo(ancho, y);
    contexto.stroke();
    contexto.setLineDash([]);
    contexto.globalAlpha = 1;
  }

  function dibujarBola(contexto, paleta, partida, ancho) {
    const cx = ancho / 2;
    const y = partida.bola.y;
    estela.push(y);
    if (estela.length > LONGITUD_ESTELA) estela.shift();
    estela.forEach((yAnterior, indice) => {
      const fraccion = (indice + 1) / estela.length;
      contexto.globalAlpha = fraccion * 0.35;
      contexto.fillStyle = paleta.bolaBorde;
      contexto.beginPath();
      contexto.arc(cx - (1 - fraccion) * 40, yAnterior + (1 - fraccion) * 12, RADIO_BOLA_PANTALLA * (0.4 + 0.6 * fraccion), 0, Math.PI * 2);
      contexto.fill();
    });
    contexto.globalAlpha = 1;

    const invulnerable = partida.tiempo < partida.invulnerableHasta;
    if (invulnerable && Math.floor(partida.tiempo * FRECUENCIA_PARPADEO) % 2 === 0) contexto.globalAlpha = 0.4;
    contexto.shadowColor = paleta.bola;
    contexto.shadowBlur = 24;
    const degradado = contexto.createRadialGradient(cx - RADIO_BOLA_PANTALLA * 0.35, y - RADIO_BOLA_PANTALLA * 0.35, RADIO_BOLA_PANTALLA * 0.2, cx, y, RADIO_BOLA_PANTALLA);
    degradado.addColorStop(0, paleta.brillo);
    degradado.addColorStop(0.25, paleta.bola);
    degradado.addColorStop(1, paleta.bola);
    contexto.fillStyle = degradado;
    contexto.beginPath();
    contexto.arc(cx, y, RADIO_BOLA_PANTALLA, 0, Math.PI * 2);
    contexto.fill();
    contexto.shadowBlur = 0;
    contexto.globalAlpha = 1;
  }

  function emitirParticulas(partida, ancho) {
    for (let i = 0; i < PARTICULAS_POR_PUERTA; i++) {
      const angulo = (i / PARTICULAS_POR_PUERTA) * Math.PI * 2;
      particulas.push({ x: ancho / 2, y: partida.bola.y, vx: Math.cos(angulo) * VELOCIDAD_PARTICULA, vy: Math.sin(angulo) * VELOCIDAD_PARTICULA, nacimiento: partida.tiempo });
    }
  }

  function dibujarParticulas(contexto, paleta, partida) {
    contexto.fillStyle = paleta.puertaSuperada;
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      const edad = partida.tiempo - p.nacimiento;
      if (edad > VIDA_PARTICULA_SEGUNDOS) {
        particulas.splice(i, 1);
        continue;
      }
      contexto.globalAlpha = 1 - edad / VIDA_PARTICULA_SEGUNDOS;
      contexto.beginPath();
      contexto.arc(p.x + p.vx * edad, p.y + p.vy * edad, 4, 0, Math.PI * 2);
      contexto.fill();
    }
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
      dibujarFondo(contexto, paleta, ancho, alto, partida);
      dibujarGuia(contexto, paleta, partida, ancho, alto);
      const siguiente = puertaSiguiente(partida);
      // De la más lejana a la más cercana para que las cercanas tapen a las lejanas.
      const ordenadas = [...partida.puertas].sort((a, b) => b.x - a.x);
      for (const puerta of ordenadas) dibujarPuerta(contexto, paleta, partida, puerta, ancho, alto, puerta === siguiente);
      if (partida.puertasSuperadas > ultimasSuperadas) emitirParticulas(partida, ancho);
      ultimasSuperadas = partida.puertasSuperadas;
      dibujarParticulas(contexto, paleta, partida);
      dibujarBola(contexto, paleta, partida, ancho);
    },
    limpiarEstela() {
      estela.length = 0;
      particulas.length = 0;
      ultimasSuperadas = 0;
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
