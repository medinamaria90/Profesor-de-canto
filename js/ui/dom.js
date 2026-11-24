// Utilidades mínimas para construir la interfaz sin plantillas de texto.

// el('button', { clase: 'boton', onClick: fn, 'aria-label': 'Cerrar' }, 'Texto', otroNodo)
export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'clase') nodo.className = valor;
    else if (clave === 'texto') nodo.textContent = valor;
    else if (clave === 'datos') Object.assign(nodo.dataset, valor);
    else if (clave === 'estilo') Object.assign(nodo.style, valor);
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  nodo.append(...hijos.flat(Infinity).filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false));
  return nodo;
}

export function svg(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElementNS('http://www.w3.org/2000/svg', etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor !== null && valor !== undefined) nodo.setAttribute(clave, valor);
  }
  nodo.append(...hijos.flat());
  return nodo;
}

export function leerVariableCss(nombre, elemento = document.documentElement) {
  return getComputedStyle(elemento).getPropertyValue(nombre).trim();
}

export function esperar(milisegundos) {
  return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

export function prefiereMenosMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Ajusta un canvas a su tamaño CSS y a la densidad de píxeles del dispositivo.
export function ajustarCanvas(canvas) {
  const proporcion = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  const ancho = Math.max(1, Math.round(width * proporcion));
  const alto = Math.max(1, Math.round(height * proporcion));
  if (canvas.width !== ancho || canvas.height !== alto) {
    canvas.width = ancho;
    canvas.height = alto;
  }
  const contexto = canvas.getContext('2d');
  contexto.setTransform(proporcion, 0, 0, proporcion, 0, 0);
  return { contexto, ancho: width, alto: height };
}
