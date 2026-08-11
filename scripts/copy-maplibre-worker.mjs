import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// O worker do maplibre-gl 6 importa './maplibre-gl-shared.mjs' por caminho
// relativo. Como bundler nenhum reescreve imports dentro de um asset estatico,
// os dois precisam ser servidos lado a lado com os nomes originais.
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs'));
const targetDir = join(process.cwd(), 'public', 'maplibre');

await mkdir(targetDir, { recursive: true });

await Promise.all(FILES.map((file) => copyFile(join(distDir, file), join(targetDir, file))));
