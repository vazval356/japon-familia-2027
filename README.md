# Japón en familia 2027

Guía web para decidir en familia qué ver en el viaje a Japón (julio de 2027):
75 lugares con fotos y vídeos, votación compartida, mapas por zona, los siete
itinerarios comparados y avisos comprobados.

- **Web:** se publica sola en GitHub Pages con cada `push` a `main`
  (`.github/workflows/pages.yml`, que además minifica CSS y JS).
- **Votos:** tabla `votes` en Supabase (`supabase/votos.sql`). La página usa la
  clave publicable, que está pensada para ir en el navegador.
- **Contenido:** `site/index.html`, `site/assets/` y `site/img/p/` (fotos en WebP
  de Wikimedia Commons, licencias libres). Mapas © colaboradores de OpenStreetMap.
