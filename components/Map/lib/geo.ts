import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

import type { Coordinate } from '@/types/coordinate';
import type { Location } from '@/types/location';
import type { Relation } from '@/types/relation';
import type { Zone } from '@/types/zone';

export type MapGeoJson = FeatureCollection<Geometry, GeoJsonProperties>;

export const EMPTY_FEATURE_COLLECTION: MapGeoJson = {
  type: 'FeatureCollection',
  features: [],
};

export function coordinatesToRing(coordinates: Coordinate[]): number[][] {
  if (coordinates.length < 3) return [];

  const ring = coordinates.map(({ lng, lat }) => [lng, lat]);

  const area = ring.reduce((sum, [x1, y1], index) => {
    const [x2, y2] = ring[(index + 1) % ring.length];

    return sum + x1 * y2 - x2 * y1;
  }, 0);

  // GeoJSON pede o anel externo no sentido anti-horario
  if (area < 0) {
    ring.reverse();
  }

  ring.push([...ring[0]]);

  return ring;
}

export function toLocationsGeoJSON(locations: Location[]): MapGeoJson {
  return {
    type: 'FeatureCollection',
    features: locations.map((location) => ({
      type: 'Feature',
      properties: {
        id: location.id,
        name: location.name,
        type: location.type,
      },
      geometry: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
    })),
  };
}

export function toZonesGeoJSON(zones: Zone[]): MapGeoJson {
  return {
    type: 'FeatureCollection',
    features: zones
      .filter((zone) => zone.coordinates.length >= 3)
      .map((zone) => ({
        type: 'Feature',
        properties: {
          id: zone.id,
          name: zone.name,
          color: zone.color,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinatesToRing(zone.coordinates)],
        },
      })),
  };
}

export function toRelationsGeoJSON(
  relations: Relation[],
  locationsById: Record<string, Location>
): MapGeoJson {
  return {
    type: 'FeatureCollection',
    features: relations.flatMap((relation) => {
      const source = locationsById[relation.sourceId];
      const target = locationsById[relation.targetId];

      if (!source || !target) return [];

      return [
        {
          type: 'Feature' as const,
          properties: {
            id: relation.id,
            name: relation.name,
            sourceName: source.name,
            targetName: target.name,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [source.lng, source.lat],
              [target.lng, target.lat],
            ],
          },
        },
      ];
    }),
  };
}

export function toDrawingGeoJSON(coordinates: Coordinate[]): MapGeoJson {
  if (coordinates.length === 0) return EMPTY_FEATURE_COLLECTION;

  const vertices = coordinates.map((coordinate, index) => ({
    type: 'Feature' as const,
    properties: { index },
    geometry: {
      type: 'Point' as const,
      coordinates: [coordinate.lng, coordinate.lat],
    },
  }));

  if (coordinates.length === 1) {
    return { type: 'FeatureCollection', features: vertices };
  }

  const line = coordinates.map(({ lng, lat }) => [lng, lat]);

  if (coordinates.length >= 3) {
    line.push([...line[0]]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: line },
      },
      ...vertices,
    ],
  };
}
