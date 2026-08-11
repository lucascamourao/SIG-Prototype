export const SOURCE_IDS = {
  locations: 'locations',
  zones: 'zones',
  drawingZone: 'drawing-zone',
  relations: 'relations',
} as const;

export const LAYER_IDS = {
  locations: 'locations-circle',
  zonesFill: 'zones-fill',
  zonesLine: 'zones-line',
  zonesLabel: 'zones-label',
  drawingLine: 'drawing-zone-line',
  drawingVertex: 'drawing-zone-vertex',
  relationsCasing: 'relations-casing',
  relationsLine: 'relations-line',
  relationsLabel: 'relations-label',
} as const;

export const INTERACTIVE_LAYER_IDS: string[] = [
  LAYER_IDS.locations,
  LAYER_IDS.zonesFill,
  LAYER_IDS.zonesLabel,
  LAYER_IDS.relationsLine,
  LAYER_IDS.relationsLabel,
];
