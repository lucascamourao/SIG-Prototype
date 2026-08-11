import type { StyleSpecification } from 'maplibre-gl';

export const DEFAULT_MAP_STYLE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/**
 * Creates a MapLibre style specification for raster tile template URLs.
 *
 * @example
 * ```ts
 * const style = createRasterTileStyle('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
 * ```
 */
export function createRasterTileStyle(tileUrl: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution:
          'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    },
    layers: [
      {
        id: 'raster-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

/**
 * Resolves configured URL into a MapLibre style URL string or StyleSpecification object.
 *
 * @example
 * ```ts
 * const mapStyle = resolveMapStyleUrl();
 * ```
 */
export function resolveMapStyleUrl(
  configuredUrl: string | undefined = process.env.NEXT_PUBLIC_MAP_STYLE_URL
): string | StyleSpecification {
  const url = configuredUrl?.trim() || DEFAULT_MAP_STYLE_URL;

  if (url.includes('{z}')) {
    return createRasterTileStyle(url);
  }

  return url;
}

/**
 * Finds the first symbol layer ID for layer order anchoring.
 *
 * @example
 * ```ts
 * const symbolId = findFirstSymbolLayerId(style);
 * ```
 */
export function findFirstSymbolLayerId(style: StyleSpecification | undefined): string | undefined {
  return style?.layers?.find((layer) => layer.type === 'symbol')?.id;
}

