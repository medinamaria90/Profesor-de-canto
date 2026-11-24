// Conversión entre tempo (pulsos por minuto) y segundos. Lógica pura.

const SEGUNDOS_POR_MINUTO = 60;

export function segundosPorPulso(tempo) {
  return SEGUNDOS_POR_MINUTO / tempo;
}
