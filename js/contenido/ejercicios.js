// Convierte las plantillas de una lección (grados relativos) en ejercicios concretos adaptados al rango vocal.

import { gradosDeMelodia } from '../musica/melodias.js';

export const DURACION_SIRENA_SEGUNDOS = 4;
export const DURACION_NOTA_POR_DEFECTO = 2.5;
export const INTERVALO_MINIMO_ESCUCHA = 2;
export const INTERVALO_MAXIMO_ESCUCHA = 7;
export const INTERVALO_MAXIMO_ESCUCHA_IGUAL = 3;
export const RESPIRACION_POR_DEFECTO = { inhalar: 4, retener: 4, exhalar: 6 };

function gradosDePlantilla(plantilla) {
  if (plantilla.tipo === 'nota') return [plantilla.grado, ...plantilla.escuchar];
  if (plantilla.tipo === 'melodia') return gradosDeMelodia(plantilla.melodia);
  return [];
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

function instanciarEscucha(plantilla, rango, aleatorio) {
  const centro = Math.round((rango.minimo + rango.maximo) / 2);
  if (plantilla.variante === 'igual') {
    const sonIguales = aleatorio() < 0.5;
    const primera = enteroAleatorio(aleatorio, centro - 4, centro + 2);
    const salto = sonIguales ? 0 : enteroAleatorio(aleatorio, 1, INTERVALO_MAXIMO_ESCUCHA_IGUAL) * (aleatorio() < 0.5 ? -1 : 1);
    return { tipo: 'escucha', variante: 'igual', notas: [primera, primera + salto], respuestaCorrecta: sonIguales ? 'iguales' : 'diferentes' };
  }
  const grave = enteroAleatorio(aleatorio, centro - 5, centro + 1);
  const agudo = grave + enteroAleatorio(aleatorio, INTERVALO_MINIMO_ESCUCHA, INTERVALO_MAXIMO_ESCUCHA);
  const agudaPrimero = aleatorio() < 0.5;
  return {
    tipo: 'escucha',
    variante: 'agudo',
    notas: agudaPrimero ? [agudo, grave] : [grave, agudo],
    respuestaCorrecta: agudaPrimero ? 'primera' : 'segunda',
  };
}

export function instanciarEjercicios(plantillas, rango, aleatorio = Math.random) {
  const base = calcularNotaBase(plantillas, rango);
  return plantillas.map((plantilla, indice) => {
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
      case 'escucha':
        return { ...comun, ...instanciarEscucha(plantilla, rango, aleatorio) };
      default:
        throw new Error(`Tipo de ejercicio desconocido: ${plantilla.tipo}`);
    }
  });
}

export function requiereMicrofono(ejercicio) {
  return ejercicio.tipo === 'nota' || ejercicio.tipo === 'melodia' || ejercicio.tipo === 'sirena';
}
