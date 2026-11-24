// Dibuja la alondra (el personaje que vuela con tu voz) en un canvas 2D, mirando a la derecha.
// paleta: { cuerpo, vientre, ala, pico, ojo, brillo }. fase: tiempo en segundos para el aleteo.

const BATIDOS_POR_SEGUNDO = 4;
const ANGULO_MAXIMO_ALA = 0.9;
const INCLINACION_MAXIMA = 0.5;

export function dibujarAlondra(contexto, x, y, { tamano = 40, inclinacion = 0, fase = 0, paleta, resplandor = null }) {
  const t = tamano / 40;
  const angulo = Math.max(-INCLINACION_MAXIMA, Math.min(INCLINACION_MAXIMA, inclinacion));
  const aleteo = Math.sin(fase * Math.PI * 2 * BATIDOS_POR_SEGUNDO) * ANGULO_MAXIMO_ALA;
  contexto.save();
  contexto.translate(x, y);
  contexto.rotate(angulo);
  contexto.scale(t, t);

  if (resplandor) {
    contexto.shadowColor = resplandor;
    contexto.shadowBlur = 18;
  }

  // Ala trasera (detrás del cuerpo).
  contexto.fillStyle = paleta.ala;
  contexto.beginPath();
  contexto.moveTo(-4, -2);
  contexto.quadraticCurveTo(-14 - 6 * aleteo, -22 + 10 * aleteo, 10, -6 - 8 * aleteo);
  contexto.quadraticCurveTo(2, -2, -4, -2);
  contexto.fill();

  // Cola.
  contexto.fillStyle = paleta.cuerpo;
  contexto.beginPath();
  contexto.moveTo(-14, 0);
  contexto.lineTo(-30, -8);
  contexto.lineTo(-30, 6);
  contexto.closePath();
  contexto.fill();

  // Cuerpo.
  contexto.beginPath();
  contexto.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
  contexto.fill();
  // Vientre claro.
  contexto.fillStyle = paleta.vientre;
  contexto.beginPath();
  contexto.ellipse(2, 4, 13, 6, 0, 0, Math.PI * 2);
  contexto.fill();

  // Cabeza.
  contexto.fillStyle = paleta.cuerpo;
  contexto.beginPath();
  contexto.arc(16, -7, 8, 0, Math.PI * 2);
  contexto.fill();
  // Cresta (la alondra tiene un pequeño copete).
  contexto.beginPath();
  contexto.moveTo(12, -14);
  contexto.lineTo(15, -20);
  contexto.lineTo(19, -14);
  contexto.closePath();
  contexto.fill();
  // Pico.
  contexto.fillStyle = paleta.pico;
  contexto.beginPath();
  contexto.moveTo(23, -8);
  contexto.lineTo(31, -6);
  contexto.lineTo(23, -4);
  contexto.closePath();
  contexto.fill();
  // Ojo.
  contexto.shadowBlur = 0;
  contexto.fillStyle = paleta.ojo;
  contexto.beginPath();
  contexto.arc(18, -8, 2.2, 0, Math.PI * 2);
  contexto.fill();
  contexto.fillStyle = paleta.brillo;
  contexto.beginPath();
  contexto.arc(18.8, -8.8, 0.8, 0, Math.PI * 2);
  contexto.fill();

  // Ala delantera (encima del cuerpo).
  contexto.fillStyle = paleta.ala;
  contexto.beginPath();
  contexto.moveTo(2, -3);
  contexto.quadraticCurveTo(-8 + 4 * aleteo, -24 + 14 * aleteo, 14, -4 - 10 * aleteo);
  contexto.quadraticCurveTo(6, 2, 2, -3);
  contexto.fill();

  contexto.restore();
}
