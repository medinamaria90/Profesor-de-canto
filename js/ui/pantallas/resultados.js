// Pantalla de resultados tras una lección: XP, estrellas, racha y logros nuevos.

import { el, prefiereMenosMovimiento } from '../dom.js';
import { crearBoton } from '../componentes/boton.js';
import { crearEstrellas } from '../componentes/estrellas.js';
import { crearAnilloProgreso } from '../componentes/anillo-progreso.js';
import { icono } from '../componentes/iconos.js';
import { lanzarConfeti } from '../componentes/confeti.js';
import { TEXTOS } from '../../contenido/textos.js';
import { leerResultadoLeccion, olvidarResultadoLeccion } from '../../estado/sesion.js';
import { PUNTUACION_MAXIMA } from '../../ejercicios/puntuacion.js';
import { navegar } from '../../nucleo/router.js';

const T = TEXTOS.resultados;
const DURACION_CONTADOR_MS = 900;
const ESTRELLAS_PARA_CONFETI = 2;
const TAMANO_ANILLO_PRECISION = 112;

function animarContador(elemento, hasta, formato) {
  if (prefiereMenosMovimiento()) {
    elemento.textContent = formato(hasta);
    return;
  }
  const inicio = performance.now();
  const paso = (ahora) => {
    const progreso = Math.min(1, (ahora - inicio) / DURACION_CONTADOR_MS);
    const suavizado = 1 - (1 - progreso) ** 3;
    elemento.textContent = formato(Math.round(hasta * suavizado));
    if (progreso < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

export function crearPantallaResultados() {
  const resultado = leerResultadoLeccion();
  if (!resultado) {
    navegar('/', { reemplazar: true });
    return { elemento: el('section', { clase: 'pantalla' }) };
  }

  const contadorXp = el('p', { clase: 'resultados__xp', texto: T.xpFormato(0) });
  const anillo = crearAnilloProgreso({
    valor: resultado.puntuacion,
    maximo: PUNTUACION_MAXIMA,
    tamano: TAMANO_ANILLO_PRECISION,
    grosor: 10,
    etiqueta: `${T.precision}: ${resultado.puntuacion}%`,
    contenido: el('span', { clase: 'resultados__porcentaje', texto: `${resultado.puntuacion}%` }),
  });
  const objetivoCumplido = resultado.xpHoy >= resultado.objetivoDiarioXp;
  const escenario = el('div', { clase: 'resultados__escenario' });

  const elemento = el(
    'section',
    { clase: 'pantalla pantalla-resultados' },
    escenario,
    el('p', { clase: 'resultados__sobretitulo', texto: resultado.modoPractica ? T.tituloPractica : resultado.esRutina ? T.tituloRutina : T.titulo }),
    el('h1', { clase: 'resultados__titulo', texto: resultado.titulo }),
    resultado.modoPractica ? el('p', { clase: 'aviso', role: 'note', texto: T.practicaSinEstrellas }) : crearEstrellas(resultado.estrellas, { tamano: 'l', animadas: true }),
    !resultado.modoPractica && !resultado.esRutina && resultado.estrellas === 0 && el('p', { clase: 'aviso', role: 'note', texto: T.sinAprobar }),
    el(
      'div',
      { clase: 'resultados__tarjetas' },
      el('div', { clase: 'tarjeta resultados__tarjeta resultados__tarjeta--xp' }, el('p', { clase: 'resultados__etiqueta', texto: 'XP' }), contadorXp, resultado.bonus && el('p', { clase: 'resultados__bonus', texto: T.bonusPerfecta })),
      el('div', { clase: 'tarjeta resultados__tarjeta' }, el('p', { clase: 'resultados__etiqueta', texto: T.precision }), anillo.elemento),
    ),
    el(
      'div',
      { clase: 'resultados__racha chip chip--racha' },
      icono('fuego', { tamano: 20 }),
      el('span', { texto: T.rachaFormato(resultado.racha) }),
    ),
    objetivoCumplido && el('p', { clase: 'resultados__objetivo', texto: T.objetivoCumplido }),
    resultado.logros.length > 0 &&
      el(
        'section',
        { clase: 'resultados__logros', 'aria-label': T.logroNuevo },
        resultado.logros.map((logro) =>
          el(
            'div',
            { clase: 'logro logro--nuevo' },
            el('span', { clase: 'logro__icono', 'aria-hidden': 'true', texto: logro.icono }),
            el('div', { clase: 'logro__texto' }, el('p', { clase: 'logro__sobretitulo', texto: T.logroNuevo }), el('p', { clase: 'logro__titulo', texto: logro.titulo })),
          ),
        ),
      ),
    el('div', { clase: 'resultados__acciones' }, crearBoton(T.continuar, { ancho: true, onClick: () => navegar('/', { reemplazar: true }) })),
  );

  let detenerConfeti = () => {};
  return {
    elemento,
    montado() {
      animarContador(contadorXp, resultado.xp, T.xpFormato);
      if (resultado.estrellas >= ESTRELLAS_PARA_CONFETI) detenerConfeti = lanzarConfeti(escenario);
    },
    destruir() {
      detenerConfeti();
      olvidarResultadoLeccion();
    },
  };
}
