// Utilidades compartidas por todas las páginas del portal.

document.addEventListener('DOMContentLoaded', () => {
  // Menú móvil simple (mostrar/ocultar enlaces en pantallas angostas)
  const boton = document.querySelector('.boton-menu-movil');
  const enlaces = document.querySelector('.enlaces-nav');
  if (boton && enlaces) {
    boton.addEventListener('click', () => {
      const abierto = enlaces.classList.toggle('mostrar-movil');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
  }

  // Año automático en el pie de página
  document.querySelectorAll('[data-anio-actual]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});

// Formatea "disponible/no disponible" de forma consistente en toda la web
function etiquetaEstado(disponible) {
  return disponible
    ? '<span class="disponible-nota">Disponible</span>'
    : '<span class="pendiente-nota">Próximamente</span>';
}
