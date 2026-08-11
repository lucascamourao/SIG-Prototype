import { setWorkerUrl } from 'maplibre-gl';

// O maplibre-gl 6 deixou de embutir o worker no bundle: ele resolve a URL a
// partir de import.meta.url e desiste quando o esquema nao e http(s). O
// Turbopack define import.meta.url como file://, entao a URL fica vazia, o
// worker nunca sobe e tudo que depende dele — fontes GeoJSON e tiles vetoriais
// — nao renderiza, sem erro no console.
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href);
