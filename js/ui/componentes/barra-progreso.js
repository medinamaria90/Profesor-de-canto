import { el } from '../dom.js';

export function crearBarraProgreso({ valor = 0, maximo: maximoInicial = 1, etiqueta, variante = '' }) {
  let maximo = maximoInicial;
  let ultimoValor = valor;
  const relleno = el('div', { clase: 'barra-progreso__relleno' });
  const elemento = el(
    'div',
    {
      clase: `barra-progreso ${variante ? `barra-progreso--${variante}` : ''}`.trim(),
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': maximo,
      'aria-valuenow': valor,
      'aria-label': etiqueta,
    },
    relleno,
  );
  function actualizar(nuevoValor) {
    ultimoValor = nuevoValor;
    const porcentaje = maximo > 0 ? Math.min(100, Math.max(0, (nuevoValor / maximo) * 100)) : 0;
    relleno.style.width = `${porcentaje}%`;
    elemento.setAttribute('aria-valuenow', nuevoValor);
  }
  function fijarMaximo(nuevoMaximo) {
    maximo = nuevoMaximo;
    elemento.setAttribute('aria-valuemax', nuevoMaximo);
    actualizar(ultimoValor);
  }
  actualizar(valor);
  return { elemento, actualizar, fijarMaximo };
}
