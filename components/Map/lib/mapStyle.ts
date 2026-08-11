import type { StyleSpecification } from 'maplibre-gl';

export const DEFAULT_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

// O Next inlina NEXT_PUBLIC_* no build, entao a referencia precisa ser literal.
// O parametro existe para tornar a funcao testavel.
export function resolveMapStyleUrl(
  configuredUrl: string | undefined = process.env.NEXT_PUBLIC_MAP_STYLE_URL
): string {
  const url = configuredUrl?.trim();

  return url ? url : DEFAULT_MAP_STYLE_URL;
}

// Ancora de z-order: as camadas do projeto entram antes dos rotulos do basemap,
// senao os poligonos de zona cobrem os nomes de cidade.
export function findFirstSymbolLayerId(style: StyleSpecification | undefined): string | undefined {
  return style?.layers?.find((layer) => layer.type === 'symbol')?.id;
}
