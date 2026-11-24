// Genera sw-archivos.js con la lista de archivos de la app para que el service worker los precachee.
// Ejecutar tras añadir o quitar archivos: node herramientas/generar-lista-sw.cjs
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const CARPETAS = ['css', 'js', 'iconos', 'fuentes'];
const SUELTOS = ['index.html', 'manifest.webmanifest'];

function listar(carpeta) {
  const resultado = [];
  for (const entrada of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
    const ruta = `${carpeta}/${entrada.name}`;
    if (entrada.isDirectory()) resultado.push(...listar(ruta));
    else resultado.push(ruta);
  }
  return resultado;
}

const archivos = [...SUELTOS, ...CARPETAS.flatMap(listar)].map((ruta) => `./${ruta}`).sort();
const version = Date.now().toString(36);
const contenido = `// Generado por herramientas/generar-lista-sw.cjs; no editar a mano.
self.VERSION_ARCHIVOS = '${version}';
self.ARCHIVOS_APP = ${JSON.stringify(archivos, null, 2)};
`;
fs.writeFileSync(path.join(RAIZ, 'sw-archivos.js'), contenido);
console.log(`sw-archivos.js: ${archivos.length} archivos, versión ${version}`);
