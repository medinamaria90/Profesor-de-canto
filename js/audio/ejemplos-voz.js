// Catálogo de ejemplos sonoros de técnica vocal: cada uno imita un gesto de cantante (siseo, trino de labios,
// zumbido, vocales, ataques…) con la voz sintética para que se oiga y se copie. Cada ejemplo programa el sonido
// y devuelve { nodos, salida, duracion } para poder pararlo.

import { crearTractoVocal, crearFuenteGlotica, crearEnvolvente, crearRuido, terminarVoz } from './voz-sintetica.js';

// Los filtros de formantes quitan mucha energía: la voz sale alta para compensar; el compresor de la mesa contiene los picos.
const GANANCIA_VOZ = 1.2;
const GANANCIA_RUIDO = 0.12;
const GANANCIA_FUENTE = 0.6;
const QUINTA = 7;
const OCTAVA = 12;
const VIBRATO_CENTS = 50;
const TRINO_HZ = 27;

// Voz sostenida con una vocal (o «m», «ng»), opcionalmente con vibrato. Devuelve { fuente, tracto, env, nodos }.
function voz(contexto, midi, vocal, cuando, duracion, { ganancia = GANANCIA_VOZ, ataque = 0.05, liberacion = 0.15, vibratoCents = 0 } = {}) {
  const fuente = crearFuenteGlotica(contexto, midi, { cuando, vibratoCents });
  const nivelFuente = contexto.createGain();
  nivelFuente.gain.value = GANANCIA_FUENTE;
  const tracto = crearTractoVocal(contexto, vocal);
  const env = crearEnvolvente(contexto, ganancia, cuando, duracion, { ataque, liberacion });
  fuente.oscilador.connect(nivelFuente).connect(tracto.entrada);
  tracto.salida.connect(env);
  fuente.oscilador.start(cuando);
  fuente.vibrato.start(cuando);
  return { fuente, tracto, env, nodos: [fuente.oscilador, fuente.vibrato] };
}

function siseo(contexto, { cuando, duracion = 4 }) {
  const ruido = crearRuido(contexto, { tipo: 'highpass', frecuencia: 5000, cuando, duracion });
  const env = crearEnvolvente(contexto, GANANCIA_RUIDO, cuando, duracion, { ataque: 0.15, liberacion: 0.4 });
  ruido.salida.connect(env);
  return { ...terminarVoz(contexto, env, [ruido.fuente], cuando + duracion), duracion };
}

// «ts-ts-ts» cortos y después una «u» larga que baja despacio.
function siseoPulsado(contexto, { cuando, midi }) {
  const nodos = [];
  const salida = contexto.createGain();
  let cursor = cuando;
  for (let i = 0; i < 6; i++) {
    const ruido = crearRuido(contexto, { tipo: 'highpass', frecuencia: 4500, cuando: cursor, duracion: 0.12 });
    const env = crearEnvolvente(contexto, GANANCIA_RUIDO * 1.4, cursor, 0.12, { ataque: 0.005, liberacion: 0.08 });
    ruido.salida.connect(env).connect(salida);
    nodos.push(ruido.fuente);
    cursor += 0.3;
  }
  cursor += 0.4;
  const u = voz(contexto, midi, 'u', cursor, 3.5, { ataque: 0.08, liberacion: 0.5 });
  u.env.connect(salida);
  nodos.push(...u.nodos);
  const fin = cursor + 3.5;
  return { ...terminarVoz(contexto, salida, nodos, fin), duracion: fin - cuando };
}

// Trino de labios: zumbido cerrado modulado a ~27 Hz (los labios) con sirena de una quinta.
function trinoLabios(contexto, { cuando, midi, duracion = 4.5 }) {
  const base = voz(contexto, midi, 'm', cuando, duracion, { ataque: 0.1, liberacion: 0.3 });
  const modulador = contexto.createOscillator();
  modulador.frequency.value = TRINO_HZ;
  const profundidad = contexto.createGain();
  profundidad.gain.value = 0.45;
  const portadora = contexto.createGain();
  portadora.gain.value = 0.55;
  modulador.connect(profundidad).connect(portadora.gain);
  base.tracto.salida.disconnect();
  base.tracto.salida.connect(portadora).connect(base.env);
  const soplo = crearRuido(contexto, { tipo: 'bandpass', frecuencia: 900, q: 1.5, cuando, duracion });
  const nivelSoplo = contexto.createGain();
  nivelSoplo.gain.value = 0.25;
  soplo.salida.connect(nivelSoplo).connect(portadora);
  modulador.start(cuando);
  base.fuente.fijarAltura(midi + QUINTA, cuando + 0.3, duracion / 2 - 0.3);
  base.fuente.fijarAltura(midi, cuando + duracion / 2, duracion / 2 - 0.3);
  return { ...terminarVoz(contexto, base.env, [...base.nodos, modulador, soplo.fuente], cuando + duracion), duracion };
}

function zumbido(contexto, { cuando, midi, duracion = 3.5 }) {
  const m = voz(contexto, midi, 'm', cuando, duracion, { ataque: 0.1, liberacion: 0.4, vibratoCents: 20 });
  return { ...terminarVoz(contexto, m.env, m.nodos, cuando + duracion), duracion };
}

// «mmm» que abre a «aaa» sin perder la vibración, y luego «ng» que abre a «a».
function mascara(contexto, { cuando, midi }) {
  const duracion = 6;
  const v = voz(contexto, midi, 'm', cuando, duracion, { ataque: 0.1, liberacion: 0.4, vibratoCents: 20 });
  v.tracto.fijarVocal('a', cuando + 1.6, 0.4);
  v.tracto.fijarVocal('ng', cuando + 3.3, 0.2);
  v.tracto.fijarVocal('a', cuando + 4.6, 0.4);
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

// «ng» corto y una «a» lanzada hacia delante que crece sin apretar.
function proyeccion(contexto, { cuando, midi }) {
  const duracion = 4;
  const v = voz(contexto, midi, 'ng', cuando, duracion, { ganancia: GANANCIA_VOZ * 0.6, ataque: 0.08, liberacion: 0.4, vibratoCents: 25 });
  v.tracto.fijarVocal('a', cuando + 0.9, 0.15);
  v.env.gain.setValueAtTime(GANANCIA_VOZ * 0.6, cuando + 0.9);
  v.env.gain.linearRampToValueAtTime(GANANCIA_VOZ * 1.1, cuando + 2.6);
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

// Las cinco vocales ligadas en una misma nota.
function vocales(contexto, { cuando, midi }) {
  const lista = ['a', 'e', 'i', 'o', 'u'];
  const porVocal = 0.9;
  const duracion = lista.length * porVocal;
  const v = voz(contexto, midi, 'a', cuando, duracion, { ataque: 0.08, liberacion: 0.4, vibratoCents: 20 });
  lista.forEach((vocal, indice) => indice > 0 && v.tracto.fijarVocal(vocal, cuando + indice * porVocal, 0.2));
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

// Tres ataques: con golpe de glotis, con aire y equilibrado.
function ataques(contexto, { cuando, midi }) {
  const nodos = [];
  const salida = contexto.createGain();
  const nota = 0.9;
  const hueco = 0.6;
  // Golpe: chasquido corto y voz de golpe.
  const golpe = crearRuido(contexto, { tipo: 'lowpass', frecuencia: 1500, cuando, duracion: 0.02 });
  const envGolpe = crearEnvolvente(contexto, GANANCIA_RUIDO * 3, cuando, 0.02, { ataque: 0.001, liberacion: 0.015 });
  golpe.salida.connect(envGolpe).connect(salida);
  const a1 = voz(contexto, midi, 'a', cuando + 0.01, nota, { ataque: 0.003, liberacion: 0.2 });
  a1.env.connect(salida);
  // Aire: soplo antes de la voz.
  const inicio2 = cuando + nota + hueco;
  const soplo = crearRuido(contexto, { tipo: 'bandpass', frecuencia: 1200, q: 0.8, cuando: inicio2, duracion: 0.25 });
  const envSoplo = crearEnvolvente(contexto, GANANCIA_RUIDO * 1.5, inicio2, 0.25, { ataque: 0.03, liberacion: 0.1 });
  soplo.salida.connect(envSoplo).connect(salida);
  const a2 = voz(contexto, midi, 'a', inicio2 + 0.18, nota, { ataque: 0.12, liberacion: 0.2 });
  a2.env.connect(salida);
  // Equilibrado: aire y voz a la vez, limpio.
  const inicio3 = inicio2 + nota + hueco;
  const a3 = voz(contexto, midi, 'a', inicio3, nota, { ataque: 0.035, liberacion: 0.2, vibratoCents: 20 });
  a3.env.connect(salida);
  nodos.push(golpe.fuente, ...a1.nodos, soplo.fuente, ...a2.nodos, ...a3.nodos);
  const fin = inicio3 + nota;
  return { ...terminarVoz(contexto, salida, nodos, fin), duracion: fin - cuando };
}

// Voz por una pajita: «u» muy cerrada, filtrada estrecha, con sirena.
function pajita(contexto, { cuando, midi, duracion = 4.5 }) {
  const v = voz(contexto, midi, 'u', cuando, duracion, { ganancia: GANANCIA_VOZ * 3, ataque: 0.1, liberacion: 0.3 });
  const estrecho = contexto.createBiquadFilter();
  estrecho.type = 'bandpass';
  estrecho.frequency.value = 600;
  estrecho.Q.value = 6;
  v.tracto.salida.disconnect();
  v.tracto.salida.connect(estrecho).connect(v.env);
  v.fuente.fijarAltura(midi + QUINTA, cuando + 0.3, duracion / 2 - 0.3);
  v.fuente.fijarAltura(midi, cuando + duracion / 2, duracion / 2 - 0.3);
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

// Sirena de una octava: abajo la voz es rica (pecho) y arriba se vuelve más pura (cabeza), sin salto.
function registros(contexto, { cuando, midi, duracion = 5 }) {
  const grave = midi - 3;
  const v = voz(contexto, grave, 'u', cuando, duracion, { ataque: 0.1, liberacion: 0.4 });
  const cabeza = contexto.createOscillator();
  cabeza.type = 'sine';
  cabeza.frequency.setValueAtTime(v.fuente.oscilador.frequency.value, cuando);
  const nivelCabeza = contexto.createGain();
  nivelCabeza.gain.setValueAtTime(0, cuando);
  nivelCabeza.gain.linearRampToValueAtTime(0.6, cuando + duracion / 2);
  nivelCabeza.gain.linearRampToValueAtTime(0, cuando + duracion);
  cabeza.connect(nivelCabeza).connect(v.tracto.entrada);
  cabeza.start(cuando);
  const subida = duracion / 2 - 0.3;
  v.fuente.fijarAltura(grave + OCTAVA, cuando + 0.3, subida);
  v.fuente.fijarAltura(grave, cuando + duracion / 2, subida);
  cabeza.frequency.exponentialRampToValueAtTime(v.fuente.oscilador.frequency.value * 2, cuando + 0.3 + subida);
  cabeza.frequency.exponentialRampToValueAtTime(v.fuente.oscilador.frequency.value, cuando + duracion / 2 + subida);
  return { ...terminarVoz(contexto, v.env, [...v.nodos, cabeza], cuando + duracion), duracion };
}

// Una nota que crece durante cuatro segundos y mengua otros cuatro sin moverse de altura.
function messaDiVoce(contexto, { cuando, midi }) {
  const duracion = 8.5;
  const v = voz(contexto, midi, 'a', cuando, duracion, { ganancia: GANANCIA_VOZ * 0.15, ataque: 0.2, liberacion: 0.4, vibratoCents: 20 });
  v.env.gain.setValueAtTime(GANANCIA_VOZ * 0.15, cuando + 0.2);
  v.env.gain.linearRampToValueAtTime(GANANCIA_VOZ * 1.2, cuando + 4.2);
  v.env.gain.linearRampToValueAtTime(GANANCIA_VOZ * 0.12, cuando + 8.1);
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

// La misma nota recta y después con vibrato natural.
function vibrato(contexto, { cuando, midi }) {
  const duracion = 5;
  const v = voz(contexto, midi, 'a', cuando, duracion, { ataque: 0.08, liberacion: 0.4 });
  v.fuente.fijarVibrato(VIBRATO_CENTS, cuando + 2.2, 0.6);
  return { ...terminarVoz(contexto, v.env, v.nodos, cuando + duracion), duracion };
}

export const EJEMPLOS = {
  siseo,
  'siseo-pulsado': siseoPulsado,
  'trino-labios': trinoLabios,
  zumbido,
  mascara,
  proyeccion,
  vocales,
  ataques,
  pajita,
  registros,
  'messa-di-voce': messaDiVoce,
  vibrato,
};

export function reproducirEjemplo(contexto, id, { cuando = contexto.currentTime, midi }) {
  const ejemplo = EJEMPLOS[id];
  if (!ejemplo) throw new Error(`Ejemplo desconocido: ${id}`);
  return ejemplo(contexto, { cuando, midi });
}
