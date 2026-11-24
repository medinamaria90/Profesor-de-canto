// Un único AudioContext para toda la app, creado tras un gesto del usuario.

let contexto = null;

export function audioDisponible() {
  return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
}

export function obtenerContexto() {
  if (!contexto) {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    contexto = new Constructor();
  }
  return contexto;
}

export async function reanudarContexto() {
  const actual = obtenerContexto();
  if (actual.state === 'suspended') await actual.resume();
  return actual;
}
