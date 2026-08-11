'use client';

import type {
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { toZonesGeoJSON } from '../lib/geo';
import { LAYER_IDS, SOURCE_IDS } from '../lib/layerIds';
import type { Zone } from '@/types/zone';

type Props = {
  zones: Zone[];
  beforeId?: string;
};

const fillPaint: FillLayerSpecification['paint'] = {
  'fill-color': ['coalesce', ['get', 'color'], '#1677ff'],
  'fill-opacity': 0.24,
};

const linePaint: LineLayerSpecification['paint'] = {
  'line-color': ['coalesce', ['get', 'color'], '#1677ff'],
  'line-width': 3,
};

const labelLayout: SymbolLayerSpecification['layout'] = {
  'text-field': ['get', 'name'],
  'text-size': 13,
  'text-font': ['Noto Sans Regular'],
  'text-anchor': 'center',
  'text-allow-overlap': false,
};

const labelPaint: SymbolLayerSpecification['paint'] = {
  'text-color': '#111827',
  'text-halo-color': '#ffffff',
  'text-halo-width': 2,
};

export default function ZonesLayer({ zones, beforeId }: Props) {
  const data = useMemo(() => toZonesGeoJSON(zones), [zones]);

  return (
    <Source id={SOURCE_IDS.zones} type="geojson" data={data}>
      <Layer id={LAYER_IDS.zonesFill} type="fill" paint={fillPaint} beforeId={beforeId} />
      <Layer id={LAYER_IDS.zonesLine} type="line" paint={linePaint} beforeId={beforeId} />
      <Layer
        id={LAYER_IDS.zonesLabel}
        type="symbol"
        layout={labelLayout}
        paint={labelPaint}
        beforeId={beforeId}
      />
    </Source>
  );
}
