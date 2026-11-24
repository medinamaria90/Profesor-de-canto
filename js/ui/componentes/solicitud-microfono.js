// Tarjeta que pide el micrófono y traduce los fallos a mensajes claros.

import { el } from '../dom.js';
import { crearBoton } from './boton.js';
import { icono } from './iconos.js';
import { audio } from '../../audio/servicio-audio.js';
import { TEXTOS } from '../../contenido/textos.js';

const MENSAJES_POR_MOTIVO = {
  denegado: TEXTOS.leccion.microDenegado,
  'sin-soporte': TEXTOS.leccion.microSinSoporte,
  'sin-dispositivo': TEXTOS.leccion.microDenegado,
  fallo: TEXTOS.leccion.microDenegado,
};

export function crearSolicitudMicrofono({ alListo, alOmitir = null, textoOmitir = TEXTOS.leccion.sinMicroContinuar }) {
  const mensajeError = el('p', { clase: 'solicitud-micro__error', role: 'alert', hidden: true });
  const botonPermitir = crearBoton(TEXTOS.leccion.microPermitir, {
    ancho: true,
    icono: null,
    onClick: async () => {
      botonPermitir.disabled = true;
      mensajeError.hidden = true;
      try {
        await audio.abrirEntrada();
        alListo();
      } catch (error) {
        mensajeError.textContent = MENSAJES_POR_MOTIVO[error.motivo] ?? TEXTOS.leccion.microDenegado;
        mensajeError.hidden = false;
        botonPermitir.disabled = false;
      }
    },
  });
  const elemento = el(
    'section',
    { clase: 'solicitud-micro tarjeta', 'aria-labelledby': 'solicitud-micro-titulo' },
    el('div', { clase: 'solicitud-micro__icono' }, icono('microfono', { tamano: 40 })),
    el('h2', { clase: 'solicitud-micro__titulo', id: 'solicitud-micro-titulo', texto: TEXTOS.leccion.microTitulo }),
    el('p', { clase: 'solicitud-micro__texto', texto: TEXTOS.leccion.microTexto }),
    mensajeError,
    botonPermitir,
    alOmitir && crearBoton(textoOmitir, { variante: 'texto', ancho: true, onClick: alOmitir }),
  );
  return { elemento };
}
