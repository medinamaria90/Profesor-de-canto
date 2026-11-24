// Logros desbloqueables y su evaluación sobre el estado de progreso.

import { unidadCompletada } from './curriculum.js';
import { desbloquearLogro } from '../estado/progreso.js';

const XP_LOGRO_BRONCE = 100;
const XP_LOGRO_PLATA = 500;
const RACHA_LOGRO_CORTA = 3;
const RACHA_LOGRO_LARGA = 7;
const LECCIONES_PERFECTAS_OBJETIVO = 5;
const RUTINAS_OBJETIVO = 5;
const PUNTUACION_RUISENOR = 95;
const PUERTAS_LOGRO_BOLA = 10;
export const JUEGO_BOLA_CANTORA = 'bola-cantora';

export const LOGROS = [
  {
    id: 'primera-voz',
    icono: '🎤',
    titulo: 'Primera voz',
    descripcion: 'Completa tu primera lección.',
    condicion: (estado) => Object.keys(estado.lecciones).length >= 1,
  },
  {
    id: 'conoce-tu-voz',
    icono: '📏',
    titulo: 'Conoce tu voz',
    descripcion: 'Mide tu rango vocal.',
    condicion: (estado) => Boolean(estado.rangoVocal),
  },
  {
    id: 'racha-3',
    icono: '🔥',
    titulo: 'Tres días seguidos',
    descripcion: `Practica ${RACHA_LOGRO_CORTA} días consecutivos.`,
    condicion: (estado) => estado.mejorRacha >= RACHA_LOGRO_CORTA,
  },
  {
    id: 'racha-7',
    icono: '🏆',
    titulo: 'Una semana cantando',
    descripcion: `Practica ${RACHA_LOGRO_LARGA} días consecutivos.`,
    condicion: (estado) => estado.mejorRacha >= RACHA_LOGRO_LARGA,
  },
  {
    id: 'xp-100',
    icono: '✨',
    titulo: 'Cien de XP',
    descripcion: `Acumula ${XP_LOGRO_BRONCE} XP.`,
    condicion: (estado) => estado.xpTotal >= XP_LOGRO_BRONCE,
  },
  {
    id: 'xp-500',
    icono: '💎',
    titulo: 'Quinientos de XP',
    descripcion: `Acumula ${XP_LOGRO_PLATA} XP.`,
    condicion: (estado) => estado.xpTotal >= XP_LOGRO_PLATA,
  },
  {
    id: 'unidad-1',
    icono: '🎓',
    titulo: 'Voz despierta',
    descripcion: 'Completa la unidad 1.',
    condicion: (estado) => unidadCompletada(estado, 'u1'),
  },
  {
    id: 'cinco-perfectas',
    icono: '🌟',
    titulo: 'Cinco perfectas',
    descripcion: `Consigue tres estrellas en ${LECCIONES_PERFECTAS_OBJETIVO} lecciones.`,
    condicion: (estado) => Object.values(estado.lecciones).filter((l) => l.estrellas === 3).length >= LECCIONES_PERFECTAS_OBJETIVO,
  },
  {
    id: 'cinco-mananas',
    icono: '☀️',
    titulo: 'Cinco calentamientos',
    descripcion: `Haz la rutina diaria ${RUTINAS_OBJETIVO} días.`,
    condicion: (estado) => Object.keys(estado.rutinasDiarias).length >= RUTINAS_OBJETIVO,
  },
  {
    id: 'ruisenor',
    icono: '🐦',
    titulo: 'Ruiseñor',
    descripcion: `Logra ${PUNTUACION_RUISENOR} o más en una lección.`,
    condicion: (estado) => Object.values(estado.lecciones).some((l) => l.mejorPuntuacion >= PUNTUACION_RUISENOR),
  },
  {
    id: 'bola-10',
    icono: '🐦',
    titulo: 'Alondra voladora',
    descripcion: `Pasa ${PUERTAS_LOGRO_BOLA} puertas seguidas en el Vuelo de la alondra.`,
    condicion: (estado) => (estado.juegos?.[JUEGO_BOLA_CANTORA]?.mejorPuntuacion ?? 0) >= PUERTAS_LOGRO_BOLA,
  },
];

// Devuelve el estado con los logros nuevos desbloqueados y la lista de los que acaban de conseguirse.
export function evaluarLogros(estado, hoy) {
  let resultado = estado;
  const nuevos = [];
  for (const logro of LOGROS) {
    if (!resultado.logros[logro.id] && logro.condicion(resultado)) {
      resultado = desbloquearLogro(resultado, logro.id, hoy);
      nuevos.push(logro);
    }
  }
  return { estado: resultado, nuevos };
}
