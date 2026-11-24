import { el } from '../dom.js';
import { crearBoton } from './boton.js';

// Diálogo de confirmación accesible (elemento <dialog> nativo). Devuelve true si se confirma.
export function mostrarDialogo({ titulo, texto, confirmar, cancelar, peligro = false }) {
  return new Promise((resolver) => {
    const capa = document.getElementById('capa-modal') ?? document.body;
    let cerrado = false;
    const terminar = (resultado) => {
      if (cerrado) return;
      cerrado = true;
      dialogo.close();
      dialogo.remove();
      resolver(resultado);
    };
    const botonCancelar = cancelar ? crearBoton(cancelar, { variante: 'texto', onClick: () => terminar(false) }) : null;
    const botonConfirmar = crearBoton(confirmar, { variante: peligro ? 'peligro' : 'relleno', onClick: () => terminar(true) });
    const dialogo = el(
      'dialog',
      { clase: 'dialogo', 'aria-labelledby': 'dialogo-titulo', 'aria-describedby': 'dialogo-texto', onCancel: (evento) => { evento.preventDefault(); terminar(false); } },
      el('h2', { clase: 'dialogo__titulo', id: 'dialogo-titulo', texto: titulo }),
      el('p', { clase: 'dialogo__texto', id: 'dialogo-texto', texto }),
      el('div', { clase: 'dialogo__acciones' }, botonCancelar, botonConfirmar),
    );
    capa.append(dialogo);
    dialogo.showModal();
    (botonCancelar ?? botonConfirmar).focus();
  });
}
