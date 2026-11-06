// Inserta la barra superior, la navegación y el pie de página en cada
// página a partir de un único lugar, para que actualizar un enlace o el
// texto de contacto no signifique editar los 6 archivos HTML.

const RUTA_WHATSAPP = 'https://wa.me/59100000000'; // reemplazar por el número real del ministerio
const RUTA_FACEBOOK = '#';
const RUTA_YOUTUBE = '#';
const RUTA_INSTAGRAM = '#';

function paginaActual() {
  const p = window.location.pathname.split('/').pop();
  return p === '' ? 'index.html' : p;
}

function inyectarCabecera() {
  const destino = document.getElementById('cabecera');
  if (!destino) return;
  const actual = paginaActual();
  const enlace = (href, texto) =>
    `<a href="${href}" class="${actual === href ? 'activo' : ''}">${texto}</a>`;

  destino.innerHTML = `
    <div class="barra-superior">
      <div class="contenedor">
        <span>Ministerio de Evangelización Rural · Bolivia</span>
        <span><a href="contacto.html">Peticiones de oración</a> · <a href="${RUTA_WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a></span>
      </div>
    </div>
    <nav class="nav-principal">
      <div class="contenedor">
        <a href="index.html" class="marca" style="text-decoration:none;">
          <span class="marca-icono">RV</span>
          <span>Estudios Bíblicos RVR1960<small>Para el pequeño productor rural de Bolivia</small></span>
        </a>
        <div class="enlaces-nav">
          ${enlace('index.html', 'Inicio')}
          ${enlace('estudios.html', 'Estudios')}
          ${enlace('multimedia.html', 'Multimedia')}
          ${enlace('comunidad.html', 'Comunidad')}
          ${enlace('contacto.html', 'Contacto')}
          <a href="estudios.html#buscador" class="boton boton-primario">Buscar estudio</a>
        </div>
      </div>
    </nav>
    <div class="divisor-tejido"></div>
  `;
}

function inyectarPie() {
  const destino = document.getElementById('pie');
  if (!destino) return;
  destino.innerHTML = `
    <div class="divisor-tejido"></div>
    <footer>
      <div class="contenedor">
        <div class="pie-grid">
          <div>
            <h4>Estudios Bíblicos RVR1960</h4>
            <p>Un ministerio de evangelización que acompaña con la Palabra de Dios a los pequeños productores rurales del Estado Plurinacional de Bolivia, y a todo aquel que desee conocerla.</p>
            <div class="redes">
              <a class="red-btn" href="${RUTA_FACEBOOK}" target="_blank" rel="noopener">Facebook</a>
              <a class="red-btn" href="${RUTA_YOUTUBE}" target="_blank" rel="noopener">YouTube</a>
              <a class="red-btn" href="${RUTA_INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>
            </div>
          </div>
          <div>
            <h4>Explorar</h4>
            <ul>
              <li><a href="estudios.html">Todos los estudios</a></li>
              <li><a href="multimedia.html">Audio y video</a></li>
              <li><a href="comunidad.html">Devocionales diarios</a></li>
              <li><a href="comunidad.html#oracion">Muro de oración</a></li>
            </ul>
          </div>
          <div>
            <h4>Ministerio</h4>
            <ul>
              <li><a href="index.html#fe">Declaración de fe</a></li>
              <li><a href="contacto.html">Contáctanos</a></li>
              <li><a href="comunidad.html#ofrendas">Ofrendas y apoyo</a></li>
            </ul>
          </div>
        </div>
        <div class="pie-base">
          <span>&copy; <span data-anio-actual></span> Estudios Bíblicos RVR1960. Todo el contenido se comparte gratuitamente para la edificación del cuerpo de Cristo.</span>
          <span>Sitio construido y hospedado sin costo, para que el evangelio llegue sin barreras.</span>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  inyectarCabecera();
  inyectarPie();
});
