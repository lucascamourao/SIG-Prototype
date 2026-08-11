'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import * as maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import CreateLocationModal from '../Location/CreateLocationModal';
import { Location } from '@/types/location';
import { locationService } from '@/services/locationService';
import { Tool } from '@/types/tool';
import { Coordinate } from '@/types/coordinate';
import { Zone } from '@/types/zone';
import { zoneService } from '@/services/zoneService';
import CreateZoneModal from '../Zone/CreateZoneModal';
import LocationDetailsModal from '../Location/LocationDetailsModal';
import { pointsInPolygon } from '@/utils/poinstInPolygon';
import ZoneDetailsModal from '../Zone/ZoneDetailsModal';
import { Relation } from '@/types/relation';
import { relationService } from '@/services/relationService';
import CreateRelationModal from '../Relation/CreateRelationModal';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/utils/constants';
import type * as GeoJSON from 'geojson';

interface MapClientProps {
  selectedTool: Tool;
  drawingCoordinates: Coordinate[];
  setDrawingCoordinates: React.Dispatch<React.SetStateAction<Coordinate[]>>;
  isZoneModalOpen: boolean;
  setIsZoneModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type MapGeoJson = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

const emptyFeatureCollection: MapGeoJson = {
  type: 'FeatureCollection',
  features: [],
};

function coordinatesToRing(coordinates: Coordinate[]): number[][] {
  if (coordinates.length < 3) return [];

  const ring = coordinates.map(({ lng, lat }) => [lng, lat]);

  const area = ring.reduce((sum, [x1, y1], index) => {
    const [x2, y2] = ring[(index + 1) % ring.length];

    return sum + x1 * y2 - x2 * y1;
  }, 0);

  // Garante orientação anti-horária para o anel externo
  if (area < 0) {
    ring.reverse();
  }

  ring.push([...ring[0]]);

  return ring;
}

export default function MapClient({
  selectedTool,
  drawingCoordinates,
  setDrawingCoordinates,
  isZoneModalOpen,
  setIsZoneModalOpen,
}: MapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const handleMapClickRef = useRef<(lat: number, lng: number) => void>(() => {});
  const handleLocationClickRef = useRef<(location: Location) => void>(() => {});
  const handleZoneClickRef = useRef<(zone: Zone) => void>(() => {});

  const [isMapReady, setIsMapReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [locationsInsideZone, setLocationsInsideZone] = useState<Location[]>([]);
  const [isZoneDetailsOpen, setIsZoneDetailsOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLocationDetailsOpen, setIsLocationDetailsOpen] = useState(false);

  const locationsMap = useMemo(
    () => Object.fromEntries(locations.map((location) => [location.id, location])),
    [locations]
  );

  const [relations, setRelations] = useState<Relation[]>([]);
  const [firstSelectedRelationLocationId, setFirstSelectedRelationLocationId] = useState<
    string | null
  >(null);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [pendingRelation, setPendingRelation] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  // load functions =======================================================

  async function loadLocations() {
    const data = await locationService.getAll();

    setLocations(data);
  }

  async function loadZones() {
    const data = await zoneService.getAll();

    setZones(data);
  }

  async function loadRelations() {
    const data = await relationService.getAll();

    setRelations(data);
  }

  // =====================================================================

  // useEffect: chamadas no mesmo momento
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLocations();
    loadZones();
    loadRelations();
  }, []);

  // useEffect para limpar desenho temporário de zona
  useEffect(() => {
    if (selectedTool !== 'zone') {
      setDrawingCoordinates([]);
    }
  }, [selectedTool, setDrawingCoordinates]);

  // useEffect para limpar relação temporária (antes da confirmação do formulário)
  useEffect(() => {
    if (selectedTool !== 'relation') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstSelectedRelationLocationId(null);
      setPendingRelation(null);
    }
  }, [selectedTool]);

  // handle functions ===================================================

  function handleMapClick(lat: number, lng: number) {
    switch (selectedTool) {
      case 'location':
        setSelectedPosition({ lat, lng });
        setIsModalOpen(true);
        break;

      case 'zone':
        handleZoneDrawingClick(lat, lng);
        break;

      default:
        break;
    }
  }

  async function handleLocationClick(location: Location) {
    switch (selectedTool) {
      case 'relation':
        await handleRelationClick(location);
        break;

      case 'none': {
        const currLocation = locationsMap[location.id];

        if (!currLocation) return;

        setSelectedLocation(location);
        setIsLocationDetailsOpen(true);
        break;
      }

      default:
        break;
    }
  }

  function handleZoneDrawingClick(lat: number, lng: number) {
    const newCoordinate: Coordinate = { lat, lng };

    // essa forma de atualização funcional evita problemas de concorrência
    setDrawingCoordinates((previousCoordinates) => [...previousCoordinates, newCoordinate]);
  }

  async function handleRelationClick(location: Location) {
    if (!firstSelectedRelationLocationId) {
      setFirstSelectedRelationLocationId(location.id);
      return;
    }

    if (firstSelectedRelationLocationId === location.id) {
      console.log('Erro: Você escolheu o mesmo ponto!');
      return;
    }

    const relationAlreadyExists = relations.some(
      (relation) =>
        (relation.sourceId === firstSelectedRelationLocationId &&
          relation.targetId === location.id) ||
        (relation.sourceId === location.id && relation.targetId === firstSelectedRelationLocationId)
    );

    if (relationAlreadyExists) {
      console.log('Relação já existe!');
      return;
    }

    setPendingRelation({
      sourceId: firstSelectedRelationLocationId,
      targetId: location.id,
    });

    setIsRelationModalOpen(true);
    setFirstSelectedRelationLocationId(null);
  }

  function handleZoneClick(zone: Zone) {
    const pointsInside = locations.filter((location) =>
      pointsInPolygon(
        {
          lat: location.lat,
          lng: location.lng,
        },
        zone.coordinates
      )
    );

    setSelectedZone(zone);
    setLocationsInsideZone(pointsInside);
    setIsZoneDetailsOpen(true);
  }

  useEffect(() => {
    handleMapClickRef.current = handleMapClick;
    handleLocationClickRef.current = (location) => {
      void handleLocationClick(location);
    };
    handleZoneClickRef.current = handleZoneClick;
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
      zoom: DEFAULT_ZOOM,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
    });

    mapRef.current = map;

    map.on('click', (event) => {
      handleMapClickRef.current(event.lngLat.lat, event.lngLat.lng);
    });

    map.on('load', () => {
      map.addSource('zones', {
        type: 'geojson',
        data: emptyFeatureCollection,
      });
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#1677ff'],
          'fill-opacity': 0.24,
        },
      });
      map.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#1677ff'],
          'line-width': 3,
        },
      });
      map.addLayer({
        id: 'zones-label',
        type: 'symbol',
        source: 'zones',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-font': ['Noto Sans Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#111827',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      });

      console.log('teste');
      console.log(map.getStyle().layers.map((l) => l.id));

      map.addSource('drawing-zone', {
        type: 'geojson',
        data: emptyFeatureCollection,
      });
      map.addLayer({
        id: 'drawing-zone-line',
        type: 'line',
        source: 'drawing-zone',
        paint: {
          'line-color': '#1677ff',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });

      map.addSource('relations', {
        type: 'geojson',
        data: emptyFeatureCollection,
      });
      map.addLayer({
        id: 'relations-casing',
        type: 'line',
        source: 'relations',
        paint: {
          'line-color': '#ffffff',
          'line-width': 7,
          'line-opacity': 0.9,
        },
      });
      map.addLayer({
        id: 'relations-line',
        type: 'line',
        source: 'relations',
        paint: {
          'line-color': '#15803d',
          'line-width': 4,
          'line-dasharray': [2, 1],
        },
      });
      map.addLayer({
        id: 'relations-label',
        type: 'symbol',
        source: 'relations',
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-font': ['Noto Sans Regular'],
        },
        paint: {
          'text-color': '#14532d',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      });

      setIsMapReady(true);
      setTimeout(() => map.resize(), 0);
    });

    console.log('imprimindo getLayer zones-fill e zones-line: ');
    console.log(map.getLayer('zones-fill'));
    console.log(map.getLayer('zones-line'));

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = locations.map((location) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'map-location-marker';
      markerElement.setAttribute('aria-label', location.name);
      markerElement.title = location.name;
      markerElement.addEventListener('click', (event) => {
        event.stopPropagation();
        handleLocationClickRef.current(location);
      });

      return new maplibregl.Marker({ element: markerElement })
        .setLngLat([location.lng, location.lat])
        .addTo(mapRef.current!);
    });
  }, [isMapReady, locations]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapRef.current;
    const source = map?.getSource('zones') as maplibregl.GeoJSONSource | undefined;
    console.log('Imprimir source: ');
    console.log(source);
    if (!map || !source) return;

    const zonesGeoJson: MapGeoJson = {
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

    console.log('Atualizando zonas', zonesGeoJson);

    const checkSource = (event: any) => {
      if (event.sourceId !== 'zones') {
        return;
      }

      console.log('Source event:', {
        sourceId: event.sourceId,
        sourceDataType: event.sourceDataType,
        isSourceLoaded: event.isSourceLoaded,
      });

      if (event.isSourceLoaded) {
        const features = map.querySourceFeatures('zones');

        console.log('Source carregado:', features.length);
        console.log('Features:', features);

        map.off('sourcedata', checkSource);
      }
    };

    map.on('sourcedata', checkSource);

    source.setData(zonesGeoJson);

    /*
    map.once('idle', () => {
      const features = map.queryRenderedFeatures({
        layers: ['zones-fill'],
      });

      console.log('Features renderizadas:', features.length);
      console.log(features);
    });
    */
  }, [isMapReady, zones]);

  useEffect(() => {
    if (!isMapReady) return;

    const source = mapRef.current?.getSource('drawing-zone') as
      maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    console.log(zones);

    const drawingGeoJson: MapGeoJson =
      selectedTool === 'zone' && drawingCoordinates.length >= 3
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinatesToRing(drawingCoordinates)],
                },
              },
            ],
          }
        : emptyFeatureCollection;

    source.setData(drawingGeoJson);
  }, [isMapReady, selectedTool, drawingCoordinates]);

  useEffect(() => {
    if (!isMapReady) return;

    const source = mapRef.current?.getSource('relations') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const relationsGeoJson: MapGeoJson = {
      type: 'FeatureCollection',
      features: relations.flatMap((relation) => {
        const sourceLocation = locationsMap[relation.sourceId];
        const targetLocation = locationsMap[relation.targetId];

        if (!sourceLocation || !targetLocation) {
          return [];
        }

        return [
          {
            type: 'Feature' as const,
            properties: {
              name: relation.name,
              sourceName: sourceLocation.name,
              targetName: targetLocation.name,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [sourceLocation.lng, sourceLocation.lat],
                [targetLocation.lng, targetLocation.lat],
              ],
            },
          },
        ];
      }),
    };

    source.setData(relationsGeoJson);
  }, [isMapReady, relations, locationsMap]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const onZoneClick = (event: maplibregl.MapLayerMouseEvent) => {
      if (selectedTool !== 'none') return;

      const zoneId = event.features?.[0]?.properties?.id;
      const zone = zones.find((currentZone) => currentZone.id === zoneId);

      if (zone) {
        handleZoneClickRef.current(zone);
      }
    };

    const onRelationClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const coordinates = event.lngLat;
      const name = feature?.properties?.name;
      const sourceName = feature?.properties?.sourceName;
      const targetName = feature?.properties?.targetName;

      if (!name || !sourceName || !targetName) return;

      const popupContent = document.createElement('div');
      const popupTitle = document.createElement('strong');
      popupTitle.textContent = name;
      const popupRelation = document.createElement('div');
      popupRelation.textContent = `${sourceName} -> ${targetName}`;
      popupContent.append(popupTitle, popupRelation);

      new maplibregl.Popup().setLngLat(coordinates).setDOMContent(popupContent).addTo(map);
    };
    const onInteractiveMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onInteractiveMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', 'zones-fill', onZoneClick);
    map.on('click', 'zones-label', onZoneClick);
    map.on('click', 'relations-line', onRelationClick);
    map.on('click', 'relations-label', onRelationClick);
    map.on('mouseenter', 'zones-fill', onInteractiveMouseEnter);
    map.on('mouseleave', 'zones-fill', onInteractiveMouseLeave);
    map.on('mouseenter', 'relations-line', onInteractiveMouseEnter);
    map.on('mouseleave', 'relations-line', onInteractiveMouseLeave);

    return () => {
      map.off('click', 'zones-fill', onZoneClick);
      map.off('click', 'zones-label', onZoneClick);
      map.off('click', 'relations-line', onRelationClick);
      map.off('click', 'relations-label', onRelationClick);
      map.off('mouseenter', 'zones-fill', onInteractiveMouseEnter);
      map.off('mouseleave', 'zones-fill', onInteractiveMouseLeave);
      map.off('mouseenter', 'relations-line', onInteractiveMouseEnter);
      map.off('mouseleave', 'relations-line', onInteractiveMouseLeave);
    };
  }, [isMapReady, selectedTool, zones, locations]);

  return (
    <>
      <div ref={mapContainerRef} className="maplibre-map" />

      <CreateLocationModal
        open={isModalOpen}
        position={selectedPosition}
        onCancel={() => setIsModalOpen(false)}
        onLocationCreated={loadLocations}
      />

      <CreateZoneModal
        open={isZoneModalOpen}
        onCancel={() => setIsZoneModalOpen(false)}
        onZoneCreated={async ({ name, color }) => {
          await zoneService.create({
            name,
            color,
            coordinates: drawingCoordinates,
          });

          await loadZones();

          setDrawingCoordinates([]);

          setIsZoneModalOpen(false);
        }}
      />

      <CreateRelationModal
        open={isRelationModalOpen}
        onCancel={() => setIsRelationModalOpen(false)}
        onRelationCreated={async ({ name }) => {
          if (!pendingRelation) return;

          await relationService.create({
            name,
            sourceId: pendingRelation.sourceId,
            targetId: pendingRelation.targetId,
          });

          await loadRelations();

          setPendingRelation(null);
          setIsRelationModalOpen(false);
        }}
      />

      <LocationDetailsModal
        open={isLocationDetailsOpen}
        location={selectedLocation}
        onCancel={() => setIsLocationDetailsOpen(false)}
      />

      <ZoneDetailsModal
        open={isZoneDetailsOpen}
        zone={selectedZone}
        locationsInsideZone={locationsInsideZone}
        onCancel={() => setIsZoneDetailsOpen(false)}
      />
    </>
  );
}
