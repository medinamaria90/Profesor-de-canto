// Comprueba la sintaxis de todos los módulos JS de la app en un solo proceso (mucho más rápido que
// lanzar `node --check` por archivo). Uso: node --experimental-vm-modules herramientas/comprobar-sintaxis.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CARPETAS = ['js', 'tests'];
const SUELTOS = ['sw.js', 'sw-archivos.js', 'servidor.js'];

function listar(carpeta) {
  const resultado = [];
  for (const entrada of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) resultado.push(...listar(ruta));
    else if (entrada.name.endsWith('.js')) resultado.push(ruta);
  }
  return resultado;
}

let errores = 0;
const archivos = [...CARPETAS.flatMap(listar), ...SUELTOS].filter((ruta) => fs.existsSync(path.join(RAIZ, ruta)));
for (const ruta of archivos) {
  const codigo = fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
  try {
    // Solo se analiza la sintaxis: el módulo no se enlaza ni se ejecuta.
    new vm.SourceTextModule(codigo, { identifier: ruta });
  } catch (error) {
    errores++;
    console.error(`${ruta}: ${error.message}`);
  }
}
console.log(`Sintaxis comprobada en ${archivos.length} archivos; errores: ${errores}`);
process.exit(errores ? 1 : 0);
