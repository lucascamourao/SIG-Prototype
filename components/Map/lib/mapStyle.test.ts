import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_STYLE_URL, findFirstSymbolLayerId, resolveMapStyleUrl } from './mapStyle';

describe('resolveMapStyleUrl', () => {
  it('usa o ArcGIS World Imagery quando nada foi configurado', () => {
    expect(DEFAULT_MAP_STYLE_URL).toBe(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    );
    const result = resolveMapStyleUrl(undefined);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('version', 8);
  });

  it('ignora valor em branco e usa o estilo padrao', () => {
    const result = resolveMapStyleUrl('   ');
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('version', 8);
  });

  it('respeita a url de estilo json configurada', () => {
    expect(resolveMapStyleUrl('  https://exemplo.test/style.json ')).toBe(
      'https://exemplo.test/style.json'
    );
  });

  it('converte template de tile em objeto StyleSpecification', () => {
    const customTile = 'https://tiles.example.com/{z}/{x}/{y}.png';
    const result = resolveMapStyleUrl(customTile);
    expect(typeof result).toBe('object');
    expect(result).toEqual({
      version: 8,
      sources: {
        'raster-tiles': {
          type: 'raster',
          tiles: [customTile],
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
    });
  });
});

describe('findFirstSymbolLayerId', () => {
  it('devolve o id da primeira camada symbol', () => {
    const style = {
      layers: [
        { id: 'background', type: 'background' },
        { id: 'water', type: 'fill' },
        { id: 'waterway_line_label', type: 'symbol' },
        { id: 'place_label', type: 'symbol' },
      ],
    };

    expect(findFirstSymbolLayerId(style as never)).toBe('waterway_line_label');
  });

  it('devolve undefined quando o estilo nao tem symbol', () => {
    const style = { layers: [{ id: 'background', type: 'background' }] };

    expect(findFirstSymbolLayerId(style as never)).toBeUndefined();
  });

  it('devolve undefined sem estilo', () => {
    expect(findFirstSymbolLayerId(undefined)).toBeUndefined();
  });
});
