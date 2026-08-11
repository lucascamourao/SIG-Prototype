import { setWorkerUrl } from 'maplibre-gl';

// O maplibre-gl 6 deixou de embutir o worker no bundle: ele resolve a URL a
// partir de import.meta.url e desiste quando o esquema nao e http(s). O
// Turbopack define import.meta.url como file://, entao a URL fica vazia e o
// worker nunca sobe.
//
// Apontar para o asset emitido pelo bundler tambem nao serve: o worker importa
// './maplibre-gl-shared.mjs' por caminho relativo, e o Turbopack renomeia o
// arquivo com hash sem reescrever esse import. Por isso os dois sao copiados
// para public/maplibre por scripts/copy-maplibre-worker.mjs.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
