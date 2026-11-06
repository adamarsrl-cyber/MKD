// Buscador interno. Recorre CATALOGO (definido en catalogo.js) y muestra
// resultados por título de libro, capítulo o palabra clave (incluye el título
// real leído de cada .md cuando el catálogo se generó desde la carpeta md/).
// No requiere servidor: todo corre en el navegador del visitante.

function normalizar(txt) {
  return txt
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function construirIndiceBusqueda() {
  const indice = [];
  // 'alias' conserva el título genérico (p. ej. "Estudio bíblico de la parábola 3")
  // para que se pueda seguir encontrando aunque el catálogo traiga el título real del .md.
  const agregar = (tipo, e, ref) => indice.push({
    tipo, titulo: tituloEstudio(e), alias: e.titulo, ref,
    disponible: e.disponible, id: e.id
  });

  CATALOGO.libro_completo.forEach(e => agregar('Libro completo', e, e.libro));
  CATALOGO.por_capitulo.forEach(e => agregar('Por capítulo', e, e.libro));
  CATALOGO.tematicos.forEach(e => agregar('Panorama temático', e, e.libros.join(', ')));

  ['ayudas_solicitadas', 'ayudas_biblicas', 'parabolas', 'bienaventuranzas'].forEach(clave => {
    CATALOGO[clave].forEach(e => agregar(e.categoria, e, e.categoria));
  });

  return indice;
}

let INDICE_BUSQUEDA = null;

function buscarEnCatalogo(consulta, maximo = 40) {
  if (!INDICE_BUSQUEDA) INDICE_BUSQUEDA = construirIndiceBusqueda();
  const q = normalizar(consulta.trim());
  if (q.length < 2) return [];
  return INDICE_BUSQUEDA
    .filter(item => normalizar(item.titulo).includes(q)
      || normalizar(item.alias).includes(q)
      || normalizar(item.ref).includes(q))
    .slice(0, maximo);
}

function iniciarBuscador(inputId, resultadosId) {
  const input = document.getElementById(inputId);
  const caja = document.getElementById(resultadosId);
  if (!input || !caja) return;

  input.addEventListener('input', () => {
    const resultados = buscarEnCatalogo(input.value);
    if (input.value.trim().length < 2) {
      caja.innerHTML = '';
      return;
    }
    if (resultados.length === 0) {
      caja.innerHTML = '<p class="nota-formulario">No se encontraron estudios con esa palabra. Prueba con el nombre de un libro bíblico, por ejemplo "Juan" o "Salmos".</p>';
      return;
    }
    caja.innerHTML = resultados.map(r => `
      <div class="resultado-item">
        <div>
          <span class="etiqueta">${esc(r.tipo)}</span><br>
          <strong>${esc(r.titulo)}</strong>
        </div>
        ${r.disponible
          ? `<a class="boton boton-primario" href="visor.html?id=${encodeURIComponent(r.id)}">Leer en línea</a>`
          : etiquetaEstado(false)}
      </div>
    `).join('');
  });
}
