// Estado único de la app: lo carga y lo persiste. Las pantallas lo leen al montarse.

import { cargarProgreso, guardarProgreso, borrarProgreso } from './almacen.js';
import { ESTADO_INICIAL, migrarEstado } from './progreso.js';

let estado = migrarEstado(cargarProgreso());

export function obtenerEstado() {
  return estado;
}

// transformar recibe el estado actual y devuelve el nuevo (nunca lo muta).
export function actualizarEstado(transformar) {
  estado = transformar(estado);
  guardarProgreso(estado);
  return estado;
}

export function reiniciarEstado() {
  borrarProgreso();
  estado = { ...ESTADO_INICIAL };
}
