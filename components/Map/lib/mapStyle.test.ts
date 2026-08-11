import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_STYLE_URL, findFirstSymbolLayerId, resolveMapStyleUrl } from './mapStyle';

describe('resolveMapStyleUrl', () => {
  it('usa o positron do OpenFreeMap quando nada foi configurado', () => {
    expect(resolveMapStyleUrl(undefined)).toBe(DEFAULT_MAP_STYLE_URL);
    expect(DEFAULT_MAP_STYLE_URL).toBe('https://tiles.openfreemap.org/styles/positron');
  });

  it('ignora valor em branco', () => {
    expect(resolveMapStyleUrl('   ')).toBe(DEFAULT_MAP_STYLE_URL);
  });

  it('respeita a url configurada, sem espaco em volta', () => {
    expect(resolveMapStyleUrl('  https://exemplo.test/style.json ')).toBe(
      'https://exemplo.test/style.json'
    );
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
