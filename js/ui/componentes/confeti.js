// Lluvia de confeti para celebrar una lección. Respeta la preferencia de menos movimiento.

import { el, leerVariableCss, ajustarCanvas, prefiereMenosMovimiento } from '../dom.js';

const CANTIDAD_PARTICULAS = 90;
const DURACION_MS = 2600;
const GRAVEDAD = 0.12;
const VELOCIDAD_MAXIMA = 7;
const TAMANO_MAXIMO = 10;
const TAMANO_MINIMO = 5;

export function lanzarConfeti(contenedor) {
  if (prefiereMenosMovimiento()) return () => {};
  const canvas = el('canvas', { clase: 'confeti', 'aria-hidden': 'true' });
  contenedor.append(canvas);
  const paleta = ['--primario', '--secundario', '--acierto', '--racha', '--primario-contenedor'].map((nombre) => leerVariableCss(nombre));
  const { ancho } = ajustarCanvas(canvas);
  const particulas = Array.from({ length: CANTIDAD_PARTICULAS }, () => ({
    x: ancho / 2 + (Math.random() - 0.5) * ancho * 0.4,
    y: -TAMANO_MAXIMO,
    vx: (Math.random() - 0.5) * VELOCIDAD_MAXIMA,
    vy: Math.random() * VELOCIDAD_MAXIMA * 0.6 + 1,
    tamano: TAMANO_MINIMO + Math.random() * (TAMANO_MAXIMO - TAMANO_MINIMO),
    giro: Math.random() * Math.PI,
    velocidadGiro: (Math.random() - 0.5) * 0.3,
    color: paleta[Math.floor(Math.random() * paleta.length)],
  }));
  const inicio = performance.now();
  let animacion = null;

  function paso(ahora) {
    const { contexto, ancho: anchoActual, alto } = ajustarCanvas(canvas);
    contexto.clearRect(0, 0, anchoActual, alto);
    const progreso = (ahora - inicio) / DURACION_MS;
    contexto.globalAlpha = Math.max(0, 1 - Math.max(0, progreso - 0.7) / 0.3);
    for (const p of particulas) {
      p.vy += GRAVEDAD;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.velocidadGiro;
      contexto.save();
      contexto.translate(p.x, p.y);
      contexto.rotate(p.giro);
      contexto.fillStyle = p.color;
      contexto.fillRect(-p.tamano / 2, -p.tamano / 4, p.tamano, p.tamano / 2);
      contexto.restore();
    }
    if (progreso < 1) animacion = requestAnimationFrame(paso);
    else canvas.remove();
  }
  animacion = requestAnimationFrame(paso);
  return () => {
    if (animacion !== null) cancelAnimationFrame(animacion);
    canvas.remove();
  };
}
