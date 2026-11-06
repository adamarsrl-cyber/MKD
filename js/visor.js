// Lector de estudios en Markdown.
// Recibe ?id=<id del catálogo> (o ?md=<ruta relativa al .md>), descarga el
// archivo, lo convierte a HTML con marked, lo limpia con DOMPurify y arma
// índice de contenido, tamaño de letra, impresión y navegación anterior/siguiente.

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const TITULO_SITIO = 'Estudios Bíblicos RVR1960';

  // ------------------------------------------------------------------
  // Catálogo
  // ------------------------------------------------------------------
  function buscarEntrada({ id, md }) {
    for (const clave of Object.keys(CATALOGO)) {
      const e = CATALOGO[clave].find(x => (id ? x.id === id : x.md === md));
      if (e) return { e, clave };
    }
    return null;
  }

  function enlaceVolver(e, clave) {
    const destinos = {
      libro_completo: 'estudios.html#libros',
      tematicos: 'estudios.html#tematicos',
      parabolas: 'estudios.html#parabolas',
      bienaventuranzas: 'estudios.html#bienaventuranzas',
      ayudas_solicitadas: 'estudios.html#ayudas',
      ayudas_biblicas: 'estudios.html#ayudas'
    };
    if (clave === 'por_capitulo') {
      return `estudios.html?libro=${encodeURIComponent(e.libro)}#libros`;
    }
    return destinos[clave] || 'estudios.html';
  }

  function etiquetaCategoria(e, clave) {
    switch (clave) {
      case 'libro_completo': return `${e.testamento} · Libro completo`;
      case 'por_capitulo': return `${e.testamento} · ${e.libro}`;
      case 'tematicos': return 'Panorama temático';
      default: return e.categoria || 'Estudio bíblico';
    }
  }

  function vecinos(e, clave) {
    let lista = CATALOGO[clave];
    if (clave === 'por_capitulo') lista = lista.filter(x => x.libro === e.libro);
    const i = lista.findIndex(x => x.id === e.id);
    const ok = x => x && x.disponible && x.md;
    return {
      anterior: ok(lista[i - 1]) ? lista[i - 1] : null,
      siguiente: ok(lista[i + 1]) ? lista[i + 1] : null
    };
  }

  // ------------------------------------------------------------------
  // Carga del archivo
  // ------------------------------------------------------------------
  async function cargarTexto(ruta) {
    const resp = await fetch(urlMd(ruta), { cache: 'no-cache' });
    if (!resp.ok) {
      const err = new Error('http');
      err.estado = resp.status;
      throw err;
    }
    const buf = await resp.arrayBuffer();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch (_) {
      // Archivo guardado con codificación antigua de Windows
      return new TextDecoder('windows-1252').decode(buf);
    }
  }

  // Quita el bloque YAML inicial (--- ... ---) y devuelve su título si lo tiene
  function separarFrontMatter(texto) {
    const m = texto.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
    if (!m) return { cuerpo: texto, titulo: null };
    const t = m[1].match(/^\s*title\s*:\s*(.+)$/im);
    return {
      cuerpo: texto.slice(m[0].length),
      titulo: t ? t[1].trim().replace(/^["']|["']$/g, '') : null
    };
  }

  // ------------------------------------------------------------------
  // Mensajes de estado
  // ------------------------------------------------------------------
  function mostrarMensaje(titulo, partes) {
    const cont = $('lectura');
    cont.setAttribute('aria-busy', 'false');
    cont.textContent = '';
    const caja = document.createElement('div');
    caja.className = 'visor-aviso';
    const h = document.createElement('h2');
    h.textContent = titulo;
    caja.appendChild(h);
    partes.forEach(p => {
      const el = document.createElement('p');
      if (p.codigo) {
        const c = document.createElement('code');
        c.textContent = p.codigo;
        el.appendChild(c);
      } else {
        el.textContent = p;
      }
      caja.appendChild(el);
    });
    cont.appendChild(caja);
    $('titulo-estudio').textContent = 'No se pudo abrir el estudio';
  }

  function explicarError(err, ruta) {
    if (window.location.protocol === 'file:') {
      return ['No se puede leer el archivo desde una página abierta con doble clic.',
        ['Por seguridad, el navegador no deja que una página abierta como archivo local lea otros archivos.',
         'Abre el portal con el archivo inicio.bat (incluido en la carpeta del sitio) o con "python -m http.server 8000" y entra a http://localhost:8000.']];
    }
    if (err && err.estado === 404) {
      return ['El archivo de este estudio no está en el servidor.',
        ['Se buscó en:', { codigo: RUTA_BASE_MD + ruta },
         'Revisa que la carpeta de los .md esté copiada junto a index.html y que la ruta y las mayúsculas coincidan.']];
    }
    return ['No se pudo cargar el estudio.',
      ['Revisa tu conexión a internet e inténtalo de nuevo.',
       err && err.estado ? `El servidor respondió con el código ${err.estado}.` : 'No hubo respuesta del servidor.']];
  }

  // ------------------------------------------------------------------
  // Procesado del HTML ya limpio
  // ------------------------------------------------------------------
  function slugTexto(t) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'seccion';
  }

  function resolverRelativa(rutaMd, href) {
    // Resuelve href (relativo al .md actual) a una ruta relativa a RUTA_BASE_MD
    const partes = rutaMd.split('/').slice(0, -1);
    for (const seg of href.split('/')) {
      if (seg === '..') { if (!partes.length) return null; partes.pop(); }
      else if (seg !== '.' && seg !== '') partes.push(seg);
    }
    return partes.join('/');
  }

  function esExterno(href) {
    return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
  }

  function procesarContenido(cont, rutaMd) {
    // Ids en encabezados
    const usados = new Set();
    cont.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      let base = slugTexto(h.textContent), id = base, n = 2;
      while (usados.has(id)) id = `${base}-${n++}`;
      usados.add(id);
      h.id = id;
    });

    // Tablas con desplazamiento horizontal en pantallas angostas
    cont.querySelectorAll('table').forEach(t => {
      const w = document.createElement('div');
      w.className = 'tabla-scroll';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });

    // Enlaces
    cont.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href').trim();
      if (href.startsWith('#')) return;                    // ancla interna
      if (esExterno(href)) {
        if (/^(https?:|\/\/)/i.test(href)) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        } else if (!/^(mailto:|tel:)/i.test(href)) {
          a.removeAttribute('href');                       // javascript:, data:, etc.
        }
        return;
      }
      const [ruta, ancla] = href.split('#');
      if (/\.md$/i.test(ruta)) {                           // enlace a otro estudio
        const destino = resolverRelativa(rutaMd, decodeURI(ruta));
        if (destino && rutaMdValida(destino)) {
          a.href = `visor.html?md=${encodeURIComponent(destino)}${ancla ? '#' + ancla : ''}`;
          return;
        }
      }
      a.removeAttribute('href');
    });

    // Imágenes relativas a la carpeta del .md
    cont.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src').trim();
      img.loading = 'lazy';
      if (esExterno(src)) {
        if (!/^https?:/i.test(src)) img.removeAttribute('src');
        return;
      }
      const destino = resolverRelativa(rutaMd, decodeURI(src.split('#')[0]));
      if (destino) img.src = RUTA_BASE_MD + destino.split('/').map(encodeURIComponent).join('/');
      else img.removeAttribute('src');
    });
  }

  function construirIndice(cont) {
    const titulos = [...cont.querySelectorAll('h2, h3')];
    const nav = $('visor-toc');
    if (titulos.length < 3) { nav.hidden = true; return; }

    const lista = $('toc-lista');
    lista.textContent = '';
    titulos.forEach(h => {
      const li = document.createElement('li');
      li.className = h.tagName === 'H3' ? 'toc-sub' : 'toc-principal';
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      lista.appendChild(li);
    });
    nav.hidden = false;
    $('toc-detalles').open = window.matchMedia('(min-width: 1000px)').matches;

    if ('IntersectionObserver' in window) {
      const enlaces = new Map([...lista.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
      const obs = new IntersectionObserver(entradas => {
        entradas.forEach(en => {
          if (en.isIntersecting) {
            enlaces.forEach(a => a.classList.remove('activo'));
            const a = enlaces.get(en.target.id);
            if (a) a.classList.add('activo');
          }
        });
      }, { rootMargin: '0px 0px -70% 0px' });
      titulos.forEach(h => obs.observe(h));
    }
  }

  // ------------------------------------------------------------------
  // Herramientas de lectura
  // ------------------------------------------------------------------
  const ESCALAS = [0.85, 0.95, 1, 1.12, 1.25, 1.4, 1.6];
  let indiceEscala = 2;

  function aplicarEscala() {
    document.documentElement.style.setProperty('--escala-lectura', ESCALAS[indiceEscala]);
    $('btn-menos').disabled = indiceEscala === 0;
    $('btn-mas').disabled = indiceEscala === ESCALAS.length - 1;
    try { localStorage.setItem('lector-escala', String(indiceEscala)); } catch (_) { /* sin almacenamiento */ }
  }

  function iniciarHerramientas() {
    try {
      const guardada = parseInt(localStorage.getItem('lector-escala'), 10);
      if (guardada >= 0 && guardada < ESCALAS.length) indiceEscala = guardada;
    } catch (_) { /* sin almacenamiento */ }
    aplicarEscala();
    $('btn-menos').addEventListener('click', () => { if (indiceEscala > 0) { indiceEscala--; aplicarEscala(); } });
    $('btn-mas').addEventListener('click', () => { if (indiceEscala < ESCALAS.length - 1) { indiceEscala++; aplicarEscala(); } });
    $('btn-imprimir').addEventListener('click', () => window.print());

    const barra = $('barra-progreso');
    const actualizar = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.width = total > 0 ? Math.min(100, (window.scrollY / total) * 100) + '%' : '0%';
    };
    window.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
  }

  function pintarNavegacion(e, clave) {
    const nav = $('visor-nav');
    const { anterior, siguiente } = vecinos(e, clave);
    nav.textContent = '';
    const crear = (est, texto, clase) => {
      const a = document.createElement('a');
      a.className = `boton boton-contorno ${clase}`;
      a.href = urlVisor(est);
      a.textContent = texto;
      return a;
    };
    if (anterior) nav.appendChild(crear(anterior, `← ${tituloEstudio(anterior)}`, 'nav-anterior'));
    if (siguiente) nav.appendChild(crear(siguiente, `${tituloEstudio(siguiente)} →`, 'nav-siguiente'));
    nav.hidden = !nav.childElementCount;
  }

  // ------------------------------------------------------------------
  // Flujo principal
  // ------------------------------------------------------------------
  async function iniciar() {
    iniciarHerramientas();

    const idParam = params.get('id');
    const mdParam = params.get('md');
    let encontrada = null, ruta = null;

    if (idParam) {
      encontrada = buscarEntrada({ id: idParam });
      ruta = encontrada && encontrada.e.md;
    } else if (mdParam && rutaMdValida(mdParam)) {
      encontrada = buscarEntrada({ md: mdParam });
      ruta = mdParam;
    }

    if (!ruta) {
      const titulo = encontrada ? tituloEstudio(encontrada.e) : null;
      mostrarMensaje(
        titulo ? 'Este estudio todavía se está preparando' : 'No se indicó un estudio válido',
        [titulo ? `${titulo} aún no tiene archivo publicado. Vuelve pronto o suscríbete al boletín.`
                : 'Elige un estudio desde el catálogo para leerlo aquí.']);
      return;
    }

    let titulo = encontrada ? tituloEstudio(encontrada.e) : (params.get('titulo') || ruta.split('/').pop().replace(/\.md$/i, ''));
    $('enlace-volver').href = encontrada ? enlaceVolver(encontrada.e, encontrada.clave) : 'estudios.html';
    $('visor-categoria').textContent = encontrada ? etiquetaCategoria(encontrada.e, encontrada.clave) : 'Estudio bíblico';
    $('titulo-estudio').textContent = titulo;
    document.title = `${titulo} | ${TITULO_SITIO}`;
    $('enlace-descarga').href = urlMd(ruta);
    $('enlace-descarga').setAttribute('download', ruta.split('/').pop());

    let texto;
    try {
      texto = await cargarTexto(ruta);
    } catch (err) {
      const [t, p] = explicarError(err, ruta);
      mostrarMensaje(t, p);
      return;
    }

    if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
      mostrarMensaje('Falta el lector de Markdown',
        ['No se cargaron los archivos de js/vendor/ (marked.umd.js y purify.min.js).']);
      return;
    }

    const { cuerpo, titulo: tituloFM } = separarFrontMatter(texto);
    if (tituloFM && !encontrada) {
      titulo = tituloFM;
      $('titulo-estudio').textContent = titulo;
      document.title = `${titulo} | ${TITULO_SITIO}`;
    }

    const html = marked.parse(cuerpo, { gfm: true, breaks: false });
    const limpio = DOMPurify.sanitize(html);
    const cont = $('lectura');
    cont.innerHTML = limpio;
    cont.setAttribute('aria-busy', 'false');

    procesarContenido(cont, ruta);
    construirIndice(cont);

    const palabras = (cont.textContent.match(/\S+/g) || []).length;
    $('visor-meta').textContent =
      `${palabras.toLocaleString('es-BO')} palabras · lectura de unos ${Math.max(1, Math.round(palabras / 200))} min`;

    if (encontrada) pintarNavegacion(encontrada.e, encontrada.clave);

    // Si la URL trae un ancla (#seccion), ir allí ahora que el contenido existe
    if (window.location.hash) {
      const destino = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (destino) destino.scrollIntoView();
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
