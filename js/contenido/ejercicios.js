// Convierte las plantillas de una lección (grados relativos) en ejercicios concretos adaptados al rango vocal.

import { gradosDeMelodia } from '../musica/melodias.js';
import { obtenerCancion, gradosDeCancion } from './canciones.js';
import { obtenerTecnica } from './tecnicas.js';
import { compasesDeMelodia } from '../musica/arreglos.js';
import { SEMITONOS_POR_NIVEL_OIDO, NIVEL_OIDO_MINIMO } from '../estado/progreso.js';

export const DURACION_SIRENA_SEGUNDOS = 12;
export const DURACION_NOTA_POR_DEFECTO = 3;
// Nivel 1: intervalos de 2 a 7 semitonos; a partir del 2 el intervalo es fijo y cada vez más pequeño.
export const INTERVALO_MAXIMO_ESCUCHA_NIVEL_1 = 7;
const GRADOS_PARA_SUSTITUIR_OIDO = [0, 2, 4, 5, 7];
export const RESPIRACION_POR_DEFECTO = { inhalar: 4, retener: 4, exhalar: 6 };

function gradosDePlantilla(plantilla) {
  if (plantilla.tipo === 'nota') return [plantilla.grado, ...plantilla.escuchar];
  if (plantilla.tipo === 'melodia') return gradosDeMelodia(plantilla.melodia);
  if (plantilla.tipo === 'cancion' || plantilla.tipo === 'reto') return gradosDeCancion(obtenerCancion(plantilla.cancionId));
  return [];
}

// La canción se canta entera; los acordes van en la misma tonalidad y el acompañamiento los coloca en su registro.
function instanciarCancion(plantilla, base) {
  const cancion = obtenerCancion(plantilla.cancionId);
  if (!cancion) throw new Error(`Canción desconocida: ${plantilla.cancionId}`);
  return {
    titulo: cancion.titulo,
    autor: cancion.autor,
    tempo: cancion.tempo,
    notas: cancion.notas.map(([grado, pulsos]) => ({ midi: base + grado, pulsos })),
    acompanamiento: {
      estilo: cancion.estilo,
      tempo: cancion.tempo,
      compases: compasesDeMelodia(cancion.notas),
      acordes: cancion.acordes.map((acorde) => ({ compas: acorde.compas, midis: acorde.grados.map((grado) => base + grado) })),
    },
  };
}

// Elige la nota base de la lección: centra el conjunto de grados en el rango sin salirse de él.
export function calcularNotaBase(plantillas, rango) {
  const grados = plantillas.flatMap(gradosDePlantilla);
  if (grados.length === 0) return Math.round((rango.minimo + rango.maximo) / 2);
  const gradoMinimo = Math.min(...grados);
  const gradoMaximo = Math.max(...grados);
  const centroRango = (rango.minimo + rango.maximo) / 2;
  const centroGrados = (gradoMinimo + gradoMaximo) / 2;
  const baseIdeal = Math.round(centroRango - centroGrados);
  const baseMinima = rango.minimo - gradoMinimo;
  const baseMaxima = rango.maximo - gradoMaximo;
  if (baseMaxima < baseMinima) return baseIdeal;
  return Math.min(baseMaxima, Math.max(baseMinima, baseIdeal));
}

function enteroAleatorio(aleatorio, minimo, maximo) {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

// Intervalo entre las dos notas según el nivel de oído: amplio y variable al principio, fijo y diminuto después.
function intervaloDeOido(nivel, aleatorio) {
  const minimo = SEMITONOS_POR_NIVEL_OIDO[nivel] ?? SEMITONOS_POR_NIVEL_OIDO[NIVEL_OIDO_MINIMO];
  if (nivel <= NIVEL_OIDO_MINIMO) return enteroAleatorio(aleatorio, minimo, INTERVALO_MAXIMO_ESCUCHA_NIVEL_1);
  return minimo;
}

function instanciarEscucha(plantilla, rango, aleatorio, nivelOido) {
  const centro = Math.round((rango.minimo + rango.maximo) / 2);
  const intervalo = intervaloDeOido(nivelOido, aleatorio);
  if (plantilla.variante === 'igual') {
    const sonIguales = aleatorio() < 0.5;
    const primera = enteroAleatorio(aleatorio, centro - 4, centro + 2);
    const salto = sonIguales ? 0 : intervalo * (aleatorio() < 0.5 ? -1 : 1);
    return { tipo: 'escucha', variante: 'igual', nivel: nivelOido, notas: [primera, primera + salto], respuestaCorrecta: sonIguales ? 'iguales' : 'diferentes' };
  }
  const grave = enteroAleatorio(aleatorio, centro - 5, centro + 1);
  const agudo = grave + intervalo;
  const agudaPrimero = aleatorio() < 0.5;
  return {
    tipo: 'escucha',
    variante: 'agudo',
    nivel: nivelOido,
    notas: agudaPrimero ? [agudo, grave] : [grave, agudo],
    respuestaCorrecta: agudaPrimero ? 'primera' : 'segunda',
  };
}

// Cuando el oído está dominado, el ejercicio de escucha se convierte en cantar una nota tras oír dos.
function sustituirEscuchaPorCanto(plantilla, aleatorio) {
  const grado = GRADOS_PARA_SUSTITUIR_OIDO[Math.floor(aleatorio() * GRADOS_PARA_SUSTITUIR_OIDO.length)];
  return { tipo: 'nota', grado, escuchar: [0, grado], duracion: DURACION_NOTA_POR_DEFECTO };
}

// opciones: { aleatorio, nivelOido, oidoDominado }
export function instanciarEjercicios(plantillas, rango, opciones = {}) {
  const { aleatorio = Math.random, nivelOido = NIVEL_OIDO_MINIMO, oidoDominado = false } = typeof opciones === 'function' ? { aleatorio: opciones } : opciones;
  const definitivas = plantillas.map((plantilla) => (plantilla.tipo === 'escucha' && oidoDominado ? sustituirEscuchaPorCanto(plantilla, aleatorio) : plantilla));
  const base = calcularNotaBase(definitivas, rango);
  return definitivas.map((plantilla, indice) => {
    const comun = { id: `${plantilla.tipo}-${indice}`, tipo: plantilla.tipo };
    switch (plantilla.tipo) {
      case 'respiracion':
        return { ...comun, ciclos: plantilla.ciclos, fases: RESPIRACION_POR_DEFECTO };
      case 'sirena':
        return { ...comun, duracion: DURACION_SIRENA_SEGUNDOS, rango };
      case 'nota':
        return {
          ...comun,
          midi: base + plantilla.grado,
          escuchar: plantilla.escuchar.map((grado) => base + grado),
          duracion: plantilla.duracion ?? DURACION_NOTA_POR_DEFECTO,
        };
      case 'melodia':
        return {
          ...comun,
          titulo: plantilla.melodia.titulo,
          tempo: plantilla.melodia.tempo,
          notas: plantilla.melodia.notas.map(([grado, pulsos]) => ({ midi: grado === null ? null : base + grado, pulsos })),
        };
      case 'cancion':
        return { ...comun, ...instanciarCancion(plantilla, base) };
      case 'tecnica': {
        const tecnica = obtenerTecnica(plantilla.tecnicaId);
        if (!tecnica) throw new Error(`Técnica desconocida: ${plantilla.tecnicaId}`);
        return { ...comun, ...tecnica };
      }
      case 'reto': {
        const cancion = obtenerCancion(plantilla.cancionId);
        if (!cancion) throw new Error(`Canción desconocida: ${plantilla.cancionId}`);
        // Las notas repetidas seguidas se funden: una puerta por cambio de nota.
        const notas = cancion.notas.map(([grado]) => base + grado).filter((midi, indice, lista) => indice === 0 || midi !== lista[indice - 1]);
        return { ...comun, titulo: cancion.titulo, notas, rango };
      }
      case 'escucha':
        return { ...comun, ...instanciarEscucha(plantilla, rango, aleatorio, nivelOido) };
      default:
        throw new Error(`Tipo de ejercicio desconocido: ${plantilla.tipo}`);
    }
  });
}

export function requiereMicrofono(ejercicio) {
  return ['nota', 'melodia', 'sirena', 'cancion', 'reto'].includes(ejercicio.tipo);
}
