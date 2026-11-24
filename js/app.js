// Arranque de la app: navegación, rutas y guardia de bienvenida.

import { registrarRuta, registrarRutaNoEncontrada, iniciarRouter, alCambiarRuta } from './nucleo/router.js';
import { crearNavegacion } from './ui/componentes/navegacion.js';
import { crearPantallaInicio } from './ui/pantallas/inicio.js';
import { crearPantallaLeccion } from './ui/pantallas/leccion.js';
import { crearPantallaResultados } from './ui/pantallas/resultados.js';
import { crearPantallaAfinador } from './ui/pantallas/afinador.js';
import { crearPantallaJuego } from './ui/pantallas/juego.js';
import { crearPantallaPerfil } from './ui/pantallas/perfil.js';
import { crearPantallaBienvenida } from './ui/pantallas/bienvenida.js';
import { crearPantallaRangoVocal } from './ui/pantallas/rango-vocal.js';
import { crearPantallaNoEncontrada } from './ui/pantallas/no-encontrada.js';
import { crearPantallaTestOido } from './ui/pantallas/test-oido.js';
import { obtenerEstado } from './estado/tienda.js';
import { TEXTOS } from './contenido/textos.js';
import { audioDisponible } from './audio/contexto.js';
import { el } from './ui/dom.js';
import { guardarUltimoError } from './estado/almacen.js';

const RUTAS_SIN_NAVEGACION = ['/leccion', '/resultados', '/bienvenida', '/rango', '/test-oido'];
const RUTAS_DE_BIENVENIDA = ['/bienvenida', '/rango'];

function guardia(camino) {
  const { bienvenidaCompletada } = obtenerEstado();
  if (!bienvenidaCompletada && !RUTAS_DE_BIENVENIDA.includes(camino)) return '/bienvenida';
  if (bienvenidaCompletada && camino === '/bienvenida') return '/';
  return null;
}

function arrancar() {
  const contenedor = document.getElementById('contenido');
  if (!audioDisponible()) {
    contenedor.replaceChildren(el('section', { clase: 'pantalla pantalla-vacia' }, el('p', { clase: 'pantalla-vacia__texto', texto: TEXTOS.errores.audioNoDisponible })));
    return;
  }
  const navegacion = crearNavegacion([
    { camino: '/', texto: TEXTOS.navegacion.aprender, icono: 'nota' },
    { camino: '/jugar', texto: TEXTOS.navegacion.jugar, icono: 'mando' },
    { camino: '/afinador', texto: TEXTOS.navegacion.afinador, icono: 'ecualizador' },
    { camino: '/perfil', texto: TEXTOS.navegacion.perfil, icono: 'persona' },
  ]);
  document.getElementById('navegacion').append(navegacion.elemento);

  registrarRuta('/', crearPantallaInicio);
  registrarRuta('/leccion/:id', crearPantallaLeccion);
  registrarRuta('/resultados', crearPantallaResultados);
  registrarRuta('/jugar', crearPantallaJuego);
  registrarRuta('/afinador', crearPantallaAfinador);
  registrarRuta('/perfil', crearPantallaPerfil);
  registrarRuta('/bienvenida', crearPantallaBienvenida);
  registrarRuta('/rango', crearPantallaRangoVocal);
  registrarRuta('/test-oido', crearPantallaTestOido);
  registrarRutaNoEncontrada(crearPantallaNoEncontrada);

  alCambiarRuta((camino) => {
    navegacion.marcarActiva(camino);
    navegacion.mostrar(!RUTAS_SIN_NAVEGACION.some((ruta) => camino.startsWith(ruta)));
  });

  iniciarRouter(contenedor, { guardia });
}

// Cualquier error no capturado queda anotado para poder leerlo en Perfil → Diagnóstico.
function vigilarErrores() {
  window.addEventListener('error', (evento) => guardarUltimoError(`${evento.message} (${evento.filename?.split('/').pop() ?? ''}:${evento.lineno ?? ''})`));
  window.addEventListener('unhandledrejection', (evento) => guardarUltimoError(`Promesa: ${evento.reason?.message ?? evento.reason}`));
}

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('No se pudo registrar el service worker.', error));
  });
}

vigilarErrores();
arrancar();
registrarServiceWorker();
