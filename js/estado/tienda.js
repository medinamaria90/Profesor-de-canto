// Estado único de la app: lo carga, lo persiste y avisa a quien se suscriba.

import { cargarProgreso, guardarProgreso, borrarProgreso } from './almacen.js';
import { ESTADO_INICIAL, migrarEstado } from './progreso.js';

let estado = migrarEstado(cargarProgreso());
const suscriptores = new Set();

function notificar() {
  for (const suscriptor of suscriptores) suscriptor(estado);
}

export function obtenerEstado() {
  return estado;
}

// transformar recibe el estado actual y devuelve el nuevo (nunca lo muta).
export function actualizarEstado(transformar) {
  estado = transformar(estado);
  guardarProgreso(estado);
  notificar();
  return estado;
}

export function suscribir(suscriptor) {
  suscriptores.add(suscriptor);
  return () => suscriptores.delete(suscriptor);
}

export function reiniciarEstado() {
  borrarProgreso();
  estado = { ...ESTADO_INICIAL };
  notificar();
}
