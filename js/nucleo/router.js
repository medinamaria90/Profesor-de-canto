// Enrutador por hash: '#/leccion/u1-l1'. Cada ruta registra una fábrica que devuelve { elemento, destruir? }.

const rutas = [];
const oyentesCambio = new Set();
let pantallaActual = null;
let contenedor = null;
let guardia = null;
let fabricaNoEncontrada = null;

function compilarPatron(patron) {
  const nombres = [];
  const expresion = patron.replace(/:([a-zA-Z]+)/g, (_, nombre) => {
    nombres.push(nombre);
    return '([^/]+)';
  });
  return { expresion: new RegExp(`^${expresion}$`), nombres };
}

export function registrarRuta(patron, fabrica) {
  rutas.push({ ...compilarPatron(patron), fabrica });
}

export function rutaActual() {
  const bruto = window.location.hash.slice(1) || '/';
  const [camino, consulta = ''] = bruto.split('?');
  return { camino, consulta: new URLSearchParams(consulta) };
}

export function navegar(camino, { reemplazar = false } = {}) {
  const destino = `#${camino}`;
  if (reemplazar) window.location.replace(destino);
  else window.location.hash = camino;
}

export function alCambiarRuta(oyente) {
  oyentesCambio.add(oyente);
  return () => oyentesCambio.delete(oyente);
}

function resolver() {
  const { camino, consulta } = rutaActual();
  const redireccion = guardia?.(camino);
  if (redireccion && redireccion !== camino) {
    navegar(redireccion, { reemplazar: true });
    return;
  }
  for (const ruta of rutas) {
    const coincidencia = camino.match(ruta.expresion);
    if (!coincidencia) continue;
    let parametros;
    try {
      parametros = Object.fromEntries(ruta.nombres.map((nombre, i) => [nombre, decodeURIComponent(coincidencia[i + 1])]));
    } catch (error) {
      console.warn('Ruta con codificación inválida.', error);
      break;
    }
    montar(ruta.fabrica({ ...parametros, consulta }), camino);
    return;
  }
  if (fabricaNoEncontrada) montar(fabricaNoEncontrada({ consulta }), camino);
}

export function registrarRutaNoEncontrada(fabrica) {
  fabricaNoEncontrada = fabrica;
}

function montar(pantalla, camino) {
  pantallaActual?.destruir?.();
  pantallaActual = pantalla;
  contenedor.replaceChildren(pantalla.elemento);
  window.scrollTo(0, 0);
  contenedor.focus({ preventScroll: true });
  for (const oyente of oyentesCambio) oyente(camino);
  // montado() se llama con la pantalla ya en el documento, para que los canvas tengan tamaño.
  pantalla.montado?.();
}

export function iniciarRouter(elementoContenedor, { guardia: funcionGuardia } = {}) {
  contenedor = elementoContenedor;
  guardia = funcionGuardia ?? null;
  window.addEventListener('hashchange', resolver);
  resolver();
}
