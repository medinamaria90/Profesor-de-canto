import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearVentanaGuia, COLA_GUIA_SEGUNDOS } from '../js/audio/ventana-guia.js';

test('sin nota guía la ventana no está activa', () => {
  const ventana = crearVentanaGuia();
  assert.equal(ventana.activa(0), false);
  assert.equal(ventana.activa(100), false);
});

test('la ventana cubre la nota guía y una cola después', () => {
  const ventana = crearVentanaGuia();
  ventana.marcar(10, 0.5);
  assert.equal(ventana.activa(9.9), true);
  assert.equal(ventana.activa(10.4), true);
  assert.equal(ventana.activa(10.5 + COLA_GUIA_SEGUNDOS - 0.01), true);
  assert.equal(ventana.activa(10.5 + COLA_GUIA_SEGUNDOS + 0.01), false);
});

test('una nota más corta programada después no acorta la ventana', () => {
  const ventana = crearVentanaGuia();
  ventana.marcar(10, 1);
  ventana.marcar(10.2, 0.1);
  assert.equal(ventana.activa(10.9), true);
});
