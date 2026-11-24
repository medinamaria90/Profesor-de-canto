// Lógica pura del minijuego "Bola cantora": la altura de la bola la marca la nota cantada,
// y hay que pasar por el hueco de cada puerta. Sin pantalla ni audio.

export const VIDAS_INICIALES = 3;
export const VELOCIDAD_INICIAL = 120; // píxeles por segundo
export const VELOCIDAD_MAXIMA = 260;
export const INCREMENTO_VELOCIDAD_POR_PUERTA = 6;
export const SEPARACION_PUERTAS = 320; // píxeles entre puertas
export const DISTANCIA_PRIMERA_PUERTA = 110; // la primera puerta aparece enseguida
const PUERTAS_INICIALES = 4;
export const ANCHO_PUERTA = 28;
export const ALTO_HUECO_RELATIVO = 0.26; // fracción del alto del escenario
export const RADIO_BOLA = 14;
export const X_BOLA_RELATIVA = 0.25;
export const SUAVIZADO_ALTURA = 8; // cuanto mayor, más rápido sigue la bola a la voz
export const GRAVEDAD_SILENCIO = 220; // píxeles por segundo² cuando no hay voz
export const MARGEN_SEMITONOS_RANGO = 1;
export const SEGUNDOS_INVULNERABLE = 1.2;
export const XP_POR_PUERTA = 2;
export const XP_MAXIMO_PARTIDA = 40;
export const PUERTAS_PARA_SUBIR_DIFICULTAD = 4;
const SEMITONOS_ENTRE_PUERTAS_INICIAL = 4;
const SEMITONOS_ENTRE_PUERTAS_MAXIMO = 7;

// Convierte una nota MIDI en altura relativa (0 = abajo, 1 = arriba) dentro del rango vocal.
export function alturaDeMidi(midi, rango) {
  const minimo = rango.minimo - MARGEN_SEMITONOS_RANGO;
  const maximo = rango.maximo + MARGEN_SEMITONOS_RANGO;
  return Math.min(1, Math.max(0, (midi - minimo) / (maximo - minimo)));
}

export function midiDeAltura(altura, rango) {
  const minimo = rango.minimo - MARGEN_SEMITONOS_RANGO;
  const maximo = rango.maximo + MARGEN_SEMITONOS_RANGO;
  return minimo + altura * (maximo - minimo);
}

function enteroAleatorio(aleatorio, minimo, maximo) {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

// La nota de cada puerta se aleja de la anterior como mucho unos semitonos, para que sea cantable.
export function elegirNotaPuerta(notaAnterior, rango, puertasSuperadas, aleatorio) {
  const salto = Math.min(SEMITONOS_ENTRE_PUERTAS_MAXIMO, SEMITONOS_ENTRE_PUERTAS_INICIAL + Math.floor(puertasSuperadas / PUERTAS_PARA_SUBIR_DIFICULTAD));
  const minimo = Math.max(rango.minimo, notaAnterior - salto);
  const maximo = Math.min(rango.maximo, notaAnterior + salto);
  let nota = enteroAleatorio(aleatorio, minimo, maximo);
  if (nota === notaAnterior && maximo > minimo) nota = nota === maximo ? nota - 1 : nota + 1;
  return nota;
}

// secuencia: lista opcional de notas MIDI; si se da, las puertas las siguen en orden y la partida termina al acabarla.
export function crearPartida(rango, { aleatorio = Math.random, ancho = 360, alto = 480, secuencia = null } = {}) {
  const notaInicial = Math.round((rango.minimo + rango.maximo) / 2);
  const partida = {
    rango,
    ancho,
    alto,
    aleatorio,
    secuencia,
    indiceSecuencia: 0,
    puertasCreadas: 0,
    estado: 'lista', // lista | jugando | terminada
    vidas: VIDAS_INICIALES,
    puertasSuperadas: 0,
    velocidad: VELOCIDAD_INICIAL,
    desplazamiento: 0,
    bola: { x: ancho * X_BOLA_RELATIVA, y: alto / 2, velocidadY: 0 },
    alturaObjetivo: null,
    puertas: [],
    ultimaNota: notaInicial,
    invulnerableHasta: 0,
    tiempo: 0,
  };
  for (let i = 0; i < PUERTAS_INICIALES; i++) anadirPuerta(partida, ancho + DISTANCIA_PRIMERA_PUERTA + i * SEPARACION_PUERTAS);
  return partida;
}

function anadirPuerta(partida, x) {
  let nota;
  if (partida.secuencia) {
    if (partida.indiceSecuencia >= partida.secuencia.length) return;
    nota = partida.secuencia[partida.indiceSecuencia++];
  } else {
    nota = elegirNotaPuerta(partida.ultimaNota, partida.rango, partida.puertasSuperadas, partida.aleatorio);
  }
  partida.ultimaNota = nota;
  partida.puertasCreadas++;
  partida.puertas.push({ x, nota, superada: false, chocada: false });
}

export function empezar(partida) {
  partida.estado = 'jugando';
}

// Lectura de voz: midi (número) o null si hay silencio.
export function fijarVoz(partida, midi) {
  partida.alturaObjetivo = midi === null ? null : alturaDeMidi(midi, partida.rango);
}

export function yDeAltura(partida, altura) {
  return partida.alto - altura * partida.alto;
}

export function huecoDePuerta(partida, puerta) {
  const centro = yDeAltura(partida, alturaDeMidi(puerta.nota, partida.rango));
  const mitad = (ALTO_HUECO_RELATIVO * partida.alto) / 2;
  return { arriba: centro - mitad, abajo: centro + mitad, centro };
}

function moverBola(partida, dt) {
  const bola = partida.bola;
  if (partida.alturaObjetivo === null) {
    bola.velocidadY += GRAVEDAD_SILENCIO * dt;
    bola.y += bola.velocidadY * dt;
  } else {
    bola.velocidadY = 0;
    const objetivoY = yDeAltura(partida, partida.alturaObjetivo);
    bola.y += (objetivoY - bola.y) * Math.min(1, SUAVIZADO_ALTURA * dt);
  }
  bola.y = Math.min(partida.alto - RADIO_BOLA, Math.max(RADIO_BOLA, bola.y));
}

function perderVida(partida) {
  partida.vidas--;
  partida.invulnerableHasta = partida.tiempo + SEGUNDOS_INVULNERABLE;
  if (partida.vidas <= 0) partida.estado = 'terminada';
}

function comprobarPuertas(partida) {
  const bola = partida.bola;
  const eventos = [];
  for (const puerta of partida.puertas) {
    const xPuerta = puerta.x - partida.desplazamiento;
    const dentroEnX = bola.x + RADIO_BOLA > xPuerta && bola.x - RADIO_BOLA < xPuerta + ANCHO_PUERTA;
    if (!dentroEnX || puerta.superada || puerta.chocada) {
      if (!puerta.superada && !puerta.chocada && xPuerta + ANCHO_PUERTA < bola.x - RADIO_BOLA) {
        puerta.superada = true;
        partida.puertasSuperadas++;
        partida.velocidad = Math.min(VELOCIDAD_MAXIMA, partida.velocidad + INCREMENTO_VELOCIDAD_POR_PUERTA);
        eventos.push({ tipo: 'puerta', nota: puerta.nota });
      }
      continue;
    }
    const hueco = huecoDePuerta(partida, puerta);
    const dentroDelHueco = bola.y - RADIO_BOLA >= hueco.arriba && bola.y + RADIO_BOLA <= hueco.abajo;
    if (dentroDelHueco) continue;
    puerta.chocada = true;
    // Durante la invulnerabilidad se atraviesa la pared sin perder vida, pero la puerta no cuenta.
    if (partida.tiempo >= partida.invulnerableHasta) {
      perderVida(partida);
      eventos.push({ tipo: 'choque', nota: puerta.nota });
    }
  }
  return eventos;
}

function reciclarPuertas(partida) {
  while (partida.puertas.length && partida.puertas[0].x - partida.desplazamiento < -ANCHO_PUERTA * 2) {
    const ultima = partida.puertas[partida.puertas.length - 1];
    partida.puertas.shift();
    anadirPuerta(partida, ultima.x + SEPARACION_PUERTAS);
  }
  // En modo secuencia, la partida termina cuando todas las puertas han quedado atrás.
  if (partida.secuencia && partida.indiceSecuencia >= partida.secuencia.length && partida.puertas.every((puerta) => puerta.superada || puerta.chocada)) {
    partida.estado = 'terminada';
  }
}

// Avanza la simulación dt segundos y devuelve los eventos ocurridos.
export function avanzar(partida, dt) {
  if (partida.estado !== 'jugando') return [];
  partida.tiempo += dt;
  partida.desplazamiento += partida.velocidad * dt;
  moverBola(partida, dt);
  const eventos = comprobarPuertas(partida);
  reciclarPuertas(partida);
  return eventos;
}

export function xDePuerta(partida, puerta) {
  return puerta.x - partida.desplazamiento;
}

export function puertaSiguiente(partida) {
  return partida.puertas.find((puerta) => !puerta.superada && !puerta.chocada && xDePuerta(partida, puerta) + ANCHO_PUERTA >= partida.bola.x - RADIO_BOLA) ?? null;
}

export function xpDePartida(puertasSuperadas) {
  return Math.min(XP_MAXIMO_PARTIDA, puertasSuperadas * XP_POR_PUERTA);
}
