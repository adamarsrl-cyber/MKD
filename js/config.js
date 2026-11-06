// Configuración y utilidades compartidas para leer los estudios en Markdown.
// Se carga antes que catalogo.js, buscador.js, estudios.js y visor.js.

// Carpeta (relativa a index.html) donde están los archivos .md. Dentro de ella
// deben estar las subcarpetas de MKD: libro-completo, por-capitulo, tematicos,
// parabolas, bienaventuranzas, ayudas-especiales y ayudas-espirituales.
// Puede ser también una dirección completa, por ejemplo 'https://midominio.org/md/'.
const RUTA_BASE_MD = 'md/';

// Escapa texto antes de insertarlo como HTML (los títulos pueden venir de los .md).
function esc(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Título para mostrar: el leído del propio .md (si el catálogo lo trae) o el genérico.
function tituloEstudio(e) {
  return e.titulo_md || e.titulo;
}

// Una ruta de .md es válida si es relativa, sin "..", sin protocolo y termina en .md
function rutaMdValida(ruta) {
  return typeof ruta === 'string'
    && ruta.length > 3 && ruta.length < 300
    && /^[\p{L}\p{N}_\-./ ]+\.md$/iu.test(ruta)
    && !ruta.startsWith('/')
    && !ruta.split('/').some(p => p === '..' || p === '');
}

// URL real del archivo .md en el servidor
function urlMd(ruta) {
  return RUTA_BASE_MD + ruta.split('/').map(encodeURIComponent).join('/');
}

// Enlace al lector para un estudio del catálogo
function urlVisor(e) {
  return `visor.html?id=${encodeURIComponent(e.id)}`;
}
