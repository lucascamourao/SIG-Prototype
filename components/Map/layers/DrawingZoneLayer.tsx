'use client';

import type {
  CircleLayerSpecification,
  FilterSpecification,
  LineLayerSpecification,
} from 'maplibre-gl';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { toDrawingGeoJSON } from '../lib/geo';
import { LAYER_IDS, SOURCE_IDS } from '../lib/layerIds';
import type { Coordinate } from '@/types/coordinate';

type Props = {
  coordinates: Coordinate[];
  beforeId?: string;
};

const lineFilter: FilterSpecification = ['==', ['geometry-type'], 'LineString'];
const vertexFilter: FilterSpecification = ['==', ['geometry-type'], 'Point'];

const linePaint: LineLayerSpecification['paint'] = {
  'line-color': '#1677ff',
  'line-width': 3,
  'line-dasharray': [2, 2],
};

const vertexPaint: CircleLayerSpecification['paint'] = {
  'circle-color': '#1677ff',
  'circle-radius': 5,
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 2,
};

export default function DrawingZoneLayer({ coordinates, beforeId }: Props) {
  const data = useMemo(() => toDrawingGeoJSON(coordinates), [coordinates]);

  return (
    <Source id={SOURCE_IDS.drawingZone} type="geojson" data={data}>
      <Layer
        id={LAYER_IDS.drawingLine}
        type="line"
        filter={lineFilter}
        paint={linePaint}
        beforeId={beforeId}
      />
      <Layer
        id={LAYER_IDS.drawingVertex}
        type="circle"
        filter={vertexFilter}
        paint={vertexPaint}
        beforeId={beforeId}
      />
    </Source>
  );
}
