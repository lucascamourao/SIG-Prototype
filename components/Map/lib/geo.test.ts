import { describe, expect, it } from 'vitest';

import {
  EMPTY_FEATURE_COLLECTION,
  coordinatesToRing,
  toDrawingGeoJSON,
  toLocationsGeoJSON,
  toRelationsGeoJSON,
  toZonesGeoJSON,
} from './geo';

import type { Location } from '@/types/location';

const triangle = [
  { lat: -3.72, lng: -38.52 },
  { lat: -3.74, lng: -38.48 },
  { lat: -3.75, lng: -38.53 },
];

const locationA: Location = {
  id: 'a',
  name: 'Ponto A',
  description: '',
  type: 'tipo1',
  lat: -3.72,
  lng: -38.52,
};

const locationB: Location = {
  id: 'b',
  name: 'Ponto B',
  description: '',
  type: 'tipo2',
  lat: -3.74,
  lng: -38.48,
};

describe('coordinatesToRing', () => {
  it('devolve vazio com menos de tres coordenadas', () => {
    expect(coordinatesToRing(triangle.slice(0, 2))).toEqual([]);
  });

  it('fecha o anel repetindo o primeiro ponto', () => {
    const ring = coordinatesToRing(triangle);

    expect(ring).toHaveLength(4);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('emite os pares na ordem lng, lat', () => {
    expect(coordinatesToRing(triangle)).toContainEqual([-38.52, -3.72]);
  });

  it('orienta o anel externo no sentido anti-horario', () => {
    const ring = coordinatesToRing(triangle);
    const area = ring.slice(0, -1).reduce((sum, [x1, y1], index, list) => {
      const [x2, y2] = list[(index + 1) % list.length];

      return sum + x1 * y2 - x2 * y1;
    }, 0);

    expect(area).toBeGreaterThan(0);
  });
});

describe('toLocationsGeoJSON', () => {
  it('gera um Point por location com id, name e type', () => {
    const collection = toLocationsGeoJSON([locationA]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry).toEqual({
      type: 'Point',
      coordinates: [-38.52, -3.72],
    });
    expect(collection.features[0].properties).toEqual({
      id: 'a',
      name: 'Ponto A',
      type: 'tipo1',
    });
  });
});

describe('toZonesGeoJSON', () => {
  it('descarta zonas com menos de tres coordenadas', () => {
    const collection = toZonesGeoJSON([
      { id: 'z1', name: 'Incompleta', color: '#ff0000', coordinates: triangle.slice(0, 2) },
    ]);

    expect(collection.features).toEqual([]);
  });

  it('gera um Polygon com anel fechado e propriedades da zona', () => {
    const collection = toZonesGeoJSON([
      { id: 'z2', name: 'Zona', color: '#00ff00', coordinates: triangle },
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties).toEqual({
      id: 'z2',
      name: 'Zona',
      color: '#00ff00',
    });
    expect(collection.features[0].geometry.type).toBe('Polygon');
  });
});

describe('toRelationsGeoJSON', () => {
  const locationsById = { a: locationA, b: locationB };

  it('gera uma LineString ligando origem e destino', () => {
    const collection = toRelationsGeoJSON(
      [{ id: 'r1', name: 'Rota', sourceId: 'a', targetId: 'b' }],
      locationsById
    );

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [-38.52, -3.72],
        [-38.48, -3.74],
      ],
    });
    expect(collection.features[0].properties).toEqual({
      id: 'r1',
      name: 'Rota',
      sourceName: 'Ponto A',
      targetName: 'Ponto B',
    });
  });

  it('descarta relacao cuja ponta nao existe mais', () => {
    const collection = toRelationsGeoJSON(
      [{ id: 'r2', name: 'Orfa', sourceId: 'a', targetId: 'inexistente' }],
      locationsById
    );

    expect(collection.features).toEqual([]);
  });
});

describe('toDrawingGeoJSON', () => {
  it('devolve colecao vazia sem coordenadas', () => {
    expect(toDrawingGeoJSON([])).toEqual(EMPTY_FEATURE_COLLECTION);
  });

  it('devolve apenas o vertice com uma coordenada', () => {
    const collection = toDrawingGeoJSON(triangle.slice(0, 1));

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.type).toBe('Point');
  });

  it('desenha a linha ja com duas coordenadas, sem fechar', () => {
    const collection = toDrawingGeoJSON(triangle.slice(0, 2));
    const line = collection.features.find((feature) => feature.geometry.type === 'LineString');

    expect(line).toBeDefined();
    expect(collection.features.filter((feature) => feature.geometry.type === 'Point')).toHaveLength(
      2
    );
    expect(line?.geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [-38.52, -3.72],
        [-38.48, -3.74],
      ],
    });
  });

  it('fecha o tracado a partir de tres coordenadas', () => {
    const collection = toDrawingGeoJSON(triangle);
    const line = collection.features.find((feature) => feature.geometry.type === 'LineString');
    const coordinates = line?.geometry.type === 'LineString' ? line.geometry.coordinates : [];

    expect(coordinates).toHaveLength(4);
    expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
  });
});
