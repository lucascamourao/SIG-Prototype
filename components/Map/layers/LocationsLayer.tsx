'use client';

import type { CircleLayerSpecification } from 'maplibre-gl';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { toLocationsGeoJSON } from '../lib/geo';
import { LAYER_IDS, SOURCE_IDS } from '../lib/layerIds';
import type { Location } from '@/types/location';

type Props = {
  locations: Location[];
  selectedLocationId?: string;
  beforeId?: string;
};

export default function LocationsLayer({ locations, selectedLocationId, beforeId }: Props) {
  const data = useMemo(() => toLocationsGeoJSON(locations), [locations]);

  const paint = useMemo<CircleLayerSpecification['paint']>(() => {
    const selected = selectedLocationId ?? '';

    return {
      'circle-color': ['case', ['==', ['get', 'id'], selected], '#f59e0b', '#1677ff'],
      'circle-radius': ['case', ['==', ['get', 'id'], selected], 10, 7],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    };
  }, [selectedLocationId]);

  return (
    <Source id={SOURCE_IDS.locations} type="geojson" data={data}>
      <Layer id={LAYER_IDS.locations} type="circle" paint={paint} beforeId={beforeId} />
    </Source>
  );
}
