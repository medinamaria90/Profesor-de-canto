// Ejercicio: escuchar una melodía y cantarla siguiendo el rollo de pianola.

import { el } from '../ui/dom.js';
import { audio } from '../audio/servicio-audio.js';
import { segundosPorPulso, GANANCIA_ACOMPANAMIENTO } from '../audio/sintetizador.js';
import { CENTS_POR_SEMITONO } from '../musica/notas.js';
import { crearPianoRoll } from '../ui/componentes/piano-roll.js';
import { puntuarMuestrasTolerante, puntuarMelodia, estimarDesfase, UMBRAL_DOS_ESTRELLAS } from './puntuacion.js';
import { puntuarPorNotas } from './alineacion-notas.js';
import { crearCabeceraEjercicio, crearEstadoEjercicio, capturarEnTiempo } from './comun.js';
import { TEXTOS } from '../contenido/textos.js';
import { guardarUltimoError } from '../estado/almacen.js';

const T = TEXTOS.ejercicios.melodia;
const PULSOS_CUENTA_ATRAS = 2;
const RETARDO_INICIO_SEGUNDOS = 0.15;
// La melodía de una canción la toca el piano, como un profesor: clara al escuchar y de fondo al cantar.
const GANANCIA_MELODIA_PIANO = 0.3;
const GANANCIA_MELODIA_PIANO_AL_CANTAR = 0.12;
const GANANCIA_ACOMPANAMIENTO_AL_CANTAR = 0.8;
// El arranque de cada nota se ignora para no penalizar el tiempo de reacción.
const FRACCION_INICIO_IGNORADA = 0.3;
const COLA_TRAS_MELODIA_SEGUNDOS = 0.3;
const FRACCION_MISMO_LADO_PARA_CONSEJO = 0.75;

export function crearEjercicioMelodia(ejercicio, { contenedor, alTerminar, fijarAcciones }) {
  const esCancion = ejercicio.tipo === 'cancion';
  const TC = TEXTOS.ejercicios.cancion;
  const tipoTexto = esCancion ? TC.titulo : T.titulo;
  const cabecera = crearCabeceraEjercicio(tipoTexto, T.instruccionEscucha);
  const pulso = segundosPorPulso(ejercicio.tempo);
  const acompanamiento = ejercicio.acompanamiento ?? null;
  // Antes de la melodía suena un compás de entrada del piano (o dos pulsos de cuenta atrás si no hay acompañamiento).
  const pulsosEntrada = acompanamiento ? acompanamiento.pulsosPorCompas - acompanamiento.anacrusa : PULSOS_CUENTA_ATRAS;
  const instrumentoMelodia = esCancion ? 'piano' : 'guia';
  const rollo = crearPianoRoll(ejercicio.notas, ejercicio.tempo, { etiqueta: ejercicio.titulo });
  const estado = crearEstadoEjercicio();
  contenedor.append(
    cabecera.elemento,
    el('p', { clase: 'melodia__titulo', texto: esCancion && ejercicio.autor ? `${ejercicio.titulo} · ${ejercicio.autor}` : ejercicio.titulo }),
    rollo.elemento,
    estado,
  );
  let animacion = null;
  let captura = null;
  let destruido = false;
  // Cada fase lleva un turno: si el usuario cambia de fase mientras se espera al piano, la anterior no sigue.
  let turno = 0;

  // Duración desde el inicio de la melodía: la suya o la del acompañamiento, que empieza antes si hay anacrusa.
  function duracionTotal() {
    const duracionAcompanamiento = acompanamiento ? (acompanamiento.compases * acompanamiento.pulsosPorCompas - acompanamiento.anacrusa) * pulso : 0;
    return Math.max(rollo.duracion, duracionAcompanamiento);
  }

  function programarAcompanamiento(inicioMelodia, ganancia) {
    if (!acompanamiento) return;
    audio.reproducirAcompanamiento(acompanamiento, { cuando: inicioMelodia + acompanamiento.anacrusa * pulso, ganancia });
  }

  function detenerAnimacion() {
    if (animacion !== null) cancelAnimationFrame(animacion);
    animacion = null;
  }

  async function faseEscuchar() {
    const miTurno = ++turno;
    fijarAcciones([{ texto: T.cantarYa, variante: 'texto', accion: faseCantar }]);
    detenerAnimacion();
    captura?.cancelar();
    audio.detenerTodo();
    rollo.reiniciar();
    cabecera.fijarInstruccion(T.instruccionEscucha);
    estado.textContent = `${TEXTOS.leccion.escuchar}…`;
    await audio.prepararPiano();
    if (destruido || miTurno !== turno) return;
    const inicio = audio.ahora() + RETARDO_INICIO_SEGUNDOS + pulsosEntrada * pulso;
    programarAcompanamiento(inicio, 1);
    audio.reproducirSecuencia(ejercicio.notas, ejercicio.tempo, { cuando: inicio, instrumento: instrumentoMelodia, ganancia: esCancion ? GANANCIA_MELODIA_PIANO : undefined });
    const animar = () => {
      const tiempo = audio.ahora() - inicio;
      rollo.fijarTiempo(tiempo);
      if (tiempo < duracionTotal() + COLA_TRAS_MELODIA_SEGUNDOS) {
        animacion = requestAnimationFrame(animar);
        return;
      }
      animacion = null;
      estado.textContent = '';
      fijarAcciones([
        { texto: TEXTOS.leccion.tuTurno, accion: faseCantar },
        { texto: TEXTOS.leccion.escucharOtraVez, variante: 'tonal', accion: faseEscuchar },
      ]);
    };
    animacion = requestAnimationFrame(animar);
  }

  async function faseCantar() {
    const miTurno = ++turno;
    fijarAcciones([]);
    detenerAnimacion();
    audio.detenerTodo();
    captura?.cancelar();
    rollo.reiniciar();
    try {
      // Si el micrófono se cerró por el camino, se vuelve a abrir antes de grabar.
      if (!audio.tieneEntrada()) await audio.abrirEntrada();
      await audio.prepararPiano();
      if (destruido || miTurno !== turno) return;
      arrancarCaptura();
    } catch (error) {
      console.error('No se pudo empezar a cantar.', error);
      guardarUltimoError(`Cantar: ${error.message}`);
      contenedor.classList.remove('ejercicio--grabando');
      estado.textContent = TEXTOS.leccion.errorCaptura;
      fijarAcciones([{ texto: TEXTOS.leccion.reintentar, accion: faseEscuchar }]);
    }
  }

  function arrancarCaptura() {
    cabecera.fijarInstruccion(esCancion ? TC.instruccionCanta : T.instruccionCanta);
    contenedor.classList.add('ejercicio--grabando');
    const inicio = audio.ahora() + RETARDO_INICIO_SEGUNDOS + pulsosEntrada * pulso;
    // Con acompañamiento, el compás de entrada del piano marca el tempo; sin él, lo marcan los clics.
    if (!acompanamiento) for (let i = pulsosEntrada; i >= 1; i--) audio.clickMetronomo(inicio - i * pulso, i === pulsosEntrada);
    programarAcompanamiento(inicio, GANANCIA_ACOMPANAMIENTO_AL_CANTAR);
    audio.reproducirSecuencia(ejercicio.notas, ejercicio.tempo, { cuando: inicio, instrumento: instrumentoMelodia, ganancia: esCancion ? GANANCIA_MELODIA_PIANO_AL_CANTAR : GANANCIA_ACOMPANAMIENTO });
    captura = capturarEnTiempo({
      inicioAudio: inicio,
      duracion: duracionTotal(),
      alTiempo: (tiempo) => {
        rollo.fijarTiempo(tiempo);
        const texto = tiempo < 0 ? `${Math.ceil(-tiempo / pulso)}…` : TEXTOS.leccion.cantaAhora;
        if (estado.textContent !== texto) estado.textContent = texto;
      },
      alMuestra: (midi, tiempo) => rollo.registrarMuestra(tiempo, midi),
    });
    captura.promesa.then((resultado) => {
      contenedor.classList.remove('ejercicio--grabando');
      if (destruido || resultado.cancelado) return;
      evaluar(resultado.muestras);
    });
  }

  // Dos criterios y se da el mejor nota a nota: por tiempo (voz alineada con el desfase estimado) y por notas
  // cantadas (altura y orden, sin depender del tiempo). Así un retraso del dispositivo nunca cuenta como desafinar.
  function evaluar(muestrasCrudas) {
    const desfase = estimarDesfase(muestrasCrudas, rollo.segmentos);
    const muestras = muestrasCrudas.map((muestra) => ({ ...muestra, tiempo: muestra.tiempo - desfase }));
    if (desfase > 0) {
      audio.aprenderLatencia(desfase);
      rollo.reemplazarEstela(muestras);
    }
    const porNotas = puntuarPorNotas(muestrasCrudas, rollo.segmentos);
    const puntuaciones = [];
    let afinadas = 0;
    let posicion = 0;
    for (const segmento of rollo.segmentos) {
      if (segmento.midi === null) continue;
      const desde = segmento.inicio + (segmento.fin - segmento.inicio) * FRACCION_INICIO_IGNORADA;
      const cents = muestras
        .filter((muestra) => muestra.tiempo >= desde && muestra.tiempo < segmento.fin)
        .map((muestra) => (muestra.midi - segmento.midi) * CENTS_POR_SEMITONO);
      const porTiempo = puntuarMuestrasTolerante(cents).puntuacion;
      const puntuacion = Math.max(porTiempo, porNotas.porNota[posicion]?.puntuacion ?? 0);
      posicion++;
      puntuaciones.push(puntuacion);
      if (puntuacion >= UMBRAL_DOS_ESTRELLAS) afinadas++;
      rollo.marcarNota(segmento.indice, puntuacion);
    }
    estado.textContent = '';
    rollo.mostrarResumen();
    alTerminar({
      puntuacion: puntuarMelodia(puntuaciones),
      detalle: `${T.notasFormato(afinadas, puntuaciones.length)} · ${T.desfaseFormato(desfase)}`,
      errorMedio: consejoFiable(porNotas) ? porNotas.errorMedio : null,
    });
  }

  // Solo se da el consejo "cantas alto/bajo" si casi todas las notas emparejadas se desvían hacia el mismo lado.
  function consejoFiable(porNotas) {
    const conCents = porNotas.porNota.filter((nota) => nota.cents !== null);
    if (conCents.length < 3 || porNotas.errorMedio === null) return false;
    const signo = Math.sign(porNotas.errorMedio);
    const mismoLado = conCents.filter((nota) => Math.sign(nota.cents) === signo).length;
    return mismoLado / conCents.length >= FRACCION_MISMO_LADO_PARA_CONSEJO;
  }

  return {
    iniciar() {
      rollo.montar();
      faseEscuchar();
    },
    pausar() {
      detenerAnimacion();
      captura?.cancelar();
      contenedor.classList.remove('ejercicio--grabando');
      fijarAcciones([]);
    },
    reanudar() {
      faseEscuchar();
    },
    destruir() {
      destruido = true;
      detenerAnimacion();
      captura?.cancelar();
      rollo.destruir();
    },
  };
}
