// Construye dinámicamente las cuadrículas de libros/capítulos/temáticos/
// ayudas/parábolas/bienaventuranzas a partir de CATALOGO, para no tener
// que escribir a mano más de mil enlaces en el HTML.

function tarjetaLibroHTML(nombre, testamento, capitulos) {
  return `
    <div class="libro-card" data-libro="${nombre}" tabindex="0" role="button"
         aria-expanded="false" onclick="alternarCapitulos('${nombre}')">
      <h4>${nombre}</h4>
      <span>${testamento} · ${capitulos} capítulo${capitulos > 1 ? 's' : ''}</span>
    </div>
    <div class="tabla-capitulos" id="caps-${cssId(nombre)}"></div>
  `;
}

function cssId(nombre) {
  return normalizar(nombre).replace(/\s+/g, '-');
}

// Estudios por capítulo: agrupados en los dos grandes bloques (Antiguo y
// Nuevo Testamento) y, dentro de cada uno, libro por libro con sus
// capítulos respectivos.
function pintarLibros(testamentoFiltro = 'todos') {
  const cont = document.getElementById('lista-libros');
  if (!cont) return;
  const todos = CATALOGO.libro_completo.map(e => ({ nombre: e.libro, testamento: e.testamento, capitulos: e.capitulos }));

  const grupos = testamentoFiltro === 'todos'
    ? ['Antiguo Testamento', 'Nuevo Testamento']
    : [testamentoFiltro];

  cont.innerHTML = grupos.map(testamento => {
    const libros = todos.filter(l => l.testamento === testamento);
    return `
      <div class="grupo-testamento">
        <h3 class="grupo-testamento-titulo">${testamento} <span>(${libros.length} libros)</span></h3>
        <div class="lista-libros-grupo">
          ${libros.map(l => tarjetaLibroHTML(l.nombre, l.testamento, l.capitulos)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function alternarCapitulos(nombreLibro) {
  const caja = document.getElementById(`caps-${cssId(nombreLibro)}`);
  if (!caja) return;
  const abierta = caja.classList.contains('mostrar');
  document.querySelectorAll('.tabla-capitulos.mostrar').forEach(c => c.classList.remove('mostrar'));
  if (abierta) return;

  const capitulos = CATALOGO.por_capitulo.filter(c => c.libro === nombreLibro);
  caja.innerHTML = capitulos.map(c => `
    <button class="cap-btn ${c.disponible ? 'disponible' : ''}"
      title="${nombreLibro} ${c.capitulo} — ${c.disponible ? 'disponible' : 'próximamente'}"
      onclick="event.stopPropagation(); irACapitulo('${c.id}', '${nombreLibro} ${c.capitulo}', ${c.disponible})">
      ${c.capitulo}
    </button>
  `).join('');
  caja.classList.add('mostrar');
}

function irACapitulo(id, titulo, disponible) {
  if (!disponible) {
    alert(`El estudio de ${titulo} todavía se está preparando. Vuelve pronto o suscríbete al boletín para recibir un aviso.`);
    return;
  }
  window.location.href = `visor.html?id=${encodeURIComponent(id)}`;
}

function pintarTematicos() {
  const cont = document.getElementById('lista-tematicos');
  if (!cont) return;
  cont.innerHTML = CATALOGO.tematicos.map(t => `
    <div class="tarjeta">
      <div class="icono">§</div>
      <h3>${esc(tituloEstudio(t))}</h3>
      <p>${t.libros.join(' · ')}</p>
      ${t.disponible
        ? `<a class="boton boton-primario" href="${urlVisor(t)}">Leer en línea</a>`
        : etiquetaEstado(false)}
    </div>
  `).join('');
}

// Renderiza cualquier lista plana de estudios (ayudas solicitadas, ayudas
// bíblicas, parábolas, bienaventuranzas) como una lista de resultados,
// reutilizando el mismo bloque visual que el buscador.
function pintarListaSimple(contId, items) {
  const cont = document.getElementById(contId);
  if (!cont) return;
  cont.innerHTML = items.map(e => `
    <div class="resultado-item">
      <div><span class="etiqueta">${esc(e.categoria)}</span><br><strong>${esc(tituloEstudio(e))}</strong></div>
      ${e.disponible
        ? `<a class="boton boton-primario" href="${urlVisor(e)}">Leer</a>`
        : etiquetaEstado(false)}
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('lista-libros')) {
    pintarLibros('todos');
    document.querySelectorAll('.filtro-btn[data-testamento]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn[data-testamento]').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        pintarLibros(btn.dataset.testamento);
      });
    });

    // Volver desde el lector: estudios.html?libro=Génesis abre ese libro con sus capítulos
    const libroPedido = new URLSearchParams(window.location.search).get('libro');
    if (libroPedido && CATALOGO.libro_completo.some(l => l.libro === libroPedido)) {
      alternarCapitulos(libroPedido);
      const tarjeta = document.querySelector(`.libro-card[data-libro="${CSS.escape(libroPedido)}"]`);
      if (tarjeta) tarjeta.scrollIntoView({ block: 'center' });
    }
  }

  pintarTematicos();
  pintarListaSimple('lista-ayudas-solicitadas', CATALOGO.ayudas_solicitadas);
  pintarListaSimple('lista-ayudas-biblicas', CATALOGO.ayudas_biblicas);
  pintarListaSimple('lista-parabolas', CATALOGO.parabolas);
  pintarListaSimple('lista-bienaventuranzas', CATALOGO.bienaventuranzas);
});
