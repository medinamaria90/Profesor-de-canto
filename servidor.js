// Servidor estático mínimo para desarrollo (los módulos ES necesitan http://). Uso: node servidor.js [puerto]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer(async (peticion, respuesta) => {
  const url = new URL(peticion.url, `http://${peticion.headers.host}`);
  const rutaRelativa = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let rutaArchivo = join(RAIZ, rutaRelativa);
  try {
    const info = await stat(rutaArchivo);
    if (info.isDirectory()) rutaArchivo = join(rutaArchivo, 'index.html');
    const contenido = await readFile(rutaArchivo);
    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(rutaArchivo)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    respuesta.end(contenido);
  } catch (error) {
    respuesta.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end(error.code === 'ENOENT' ? 'No encontrado' : 'Error del servidor');
  }
}).listen(PUERTO, () => {
  console.log(`Alondra en http://localhost:${PUERTO}`);
});
