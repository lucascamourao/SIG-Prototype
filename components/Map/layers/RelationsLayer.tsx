'use client';

import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { toRelationsGeoJSON } from '../lib/geo';
import { LAYER_IDS, SOURCE_IDS } from '../lib/layerIds';
import type { Location } from '@/types/location';
import type { Relation } from '@/types/relation';

type Props = {
  relations: Relation[];
  locationsById: Record<string, Location>;
  beforeId?: string;
};

const casingPaint: LineLayerSpecification['paint'] = {
  'line-color': '#ffffff',
  'line-width': 7,
  'line-opacity': 0.9,
};

const linePaint: LineLayerSpecification['paint'] = {
  'line-color': '#15803d',
  'line-width': 4,
  'line-dasharray': [2, 1],
};

const labelLayout: SymbolLayerSpecification['layout'] = {
  'symbol-placement': 'line',
  'text-field': ['get', 'name'],
  'text-size': 12,
  'text-font': ['Noto Sans Regular'],
};

const labelPaint: SymbolLayerSpecification['paint'] = {
  'text-color': '#14532d',
  'text-halo-color': '#ffffff',
  'text-halo-width': 2,
};

export default function RelationsLayer({ relations, locationsById, beforeId }: Props) {
  const data = useMemo(
    () => toRelationsGeoJSON(relations, locationsById),
    [relations, locationsById]
  );

  return (
    <Source id={SOURCE_IDS.relations} type="geojson" data={data}>
      <Layer id={LAYER_IDS.relationsCasing} type="line" paint={casingPaint} beforeId={beforeId} />
      <Layer id={LAYER_IDS.relationsLine} type="line" paint={linePaint} beforeId={beforeId} />
      <Layer
        id={LAYER_IDS.relationsLabel}
        type="symbol"
        layout={labelLayout}
        paint={labelPaint}
        beforeId={beforeId}
      />
    </Source>
  );
}
