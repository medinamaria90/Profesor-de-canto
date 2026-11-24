// Punto único para crear el ejercicio adecuado según su tipo.

import { crearEjercicioNota } from './nota-sostenida.js';
import { crearEjercicioSirena } from './sirena.js';
import { crearEjercicioMelodia } from './melodia.js';
import { crearEjercicioRespiracion } from './respiracion.js';
import { crearEjercicioEscucha } from './escucha.js';

const FABRICAS = {
  nota: crearEjercicioNota,
  sirena: crearEjercicioSirena,
  melodia: crearEjercicioMelodia,
  respiracion: crearEjercicioRespiracion,
  escucha: crearEjercicioEscucha,
};

// entorno: { contenedor, alTerminar(resultado), fijarAcciones([{ texto, accion, variante? }]) }
export function crearEjercicio(ejercicio, entorno) {
  const fabrica = FABRICAS[ejercicio.tipo];
  if (!fabrica) throw new Error(`No hay ejercicio para el tipo ${ejercicio.tipo}`);
  return fabrica(ejercicio, entorno);
}
