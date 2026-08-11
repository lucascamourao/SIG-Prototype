'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  NavigationControl,
  ScaleControl,
  type ErrorEvent,
  type MapEvent,
  type MapMouseEvent,
} from 'react-map-gl/maplibre';

import CreateLocationModal from '../Location/CreateLocationModal';
import LocationDetailsModal from '../Location/LocationDetailsModal';
import CreateRelationModal from '../Relation/CreateRelationModal';
import CreateZoneModal from '../Zone/CreateZoneModal';
import ZoneDetailsModal from '../Zone/ZoneDetailsModal';

import DrawingZoneLayer from './layers/DrawingZoneLayer';
import LocationsLayer from './layers/LocationsLayer';
import RelationsLayer from './layers/RelationsLayer';
import ZonesLayer from './layers/ZonesLayer';
import RelationPopup, { type RelationPopupData } from './popups/RelationPopup';

import { useControlLabels } from './hooks/useControlLabels';
import { useMapData } from './hooks/useMapData';
import { INTERACTIVE_LAYER_IDS, LAYER_IDS } from './lib/layerIds';
import { findFirstSymbolLayerId, resolveMapStyleUrl } from './lib/mapStyle';

import { relationService } from '@/services/relationService';
import { zoneService } from '@/services/zoneService';
import type { Coordinate } from '@/types/coordinate';
import type { Location } from '@/types/location';
import type { Tool } from '@/types/tool';
import type { Zone } from '@/types/zone';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/utils/constants';
import { pointsInPolygon } from '@/utils/poinstInPolygon';

type MapViewProps = {
  selectedTool: Tool;
  drawingCoordinates: Coordinate[];
  setDrawingCoordinates: React.Dispatch<React.SetStateAction<Coordinate[]>>;
  isZoneModalOpen: boolean;
  setIsZoneModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const MAP_STYLE_URL = resolveMapStyleUrl();

const INITIAL_VIEW_STATE = {
  longitude: DEFAULT_CENTER.longitude,
  latitude: DEFAULT_CENTER.latitude,
  zoom: DEFAULT_ZOOM,
};

export default function MapView({
  selectedTool,
  drawingCoordinates,
  setDrawingCoordinates,
  isZoneModalOpen,
  setIsZoneModalOpen,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    locations,
    zones,
    relations,
    locationsById,
    reloadLocations,
    reloadZones,
    reloadRelations,
  } = useMapData();

  const [labelAnchor, setLabelAnchor] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState('auto');

  const [selectedPosition, setSelectedPosition] = useState<Coordinate | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLocationDetailsOpen, setIsLocationDetailsOpen] = useState(false);

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [locationsInsideZone, setLocationsInsideZone] = useState<Location[]>([]);
  const [isZoneDetailsOpen, setIsZoneDetailsOpen] = useState(false);

  const [firstRelationLocationId, setFirstRelationLocationId] = useState<string | null>(null);
  const [pendingRelation, setPendingRelation] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [relationPopup, setRelationPopup] = useState<RelationPopupData | null>(null);

  useControlLabels(containerRef);

  useEffect(() => {
    if (selectedTool !== 'zone') {
      setDrawingCoordinates([]);
    }
  }, [selectedTool, setDrawingCoordinates]);

  // Derivado em vez de sincronizado por efeito: sair da ferramenta de relacao
  // descarta a origem parcial sem precisar limpar estado.
  const relationSourceId = selectedTool === 'relation' ? firstRelationLocationId : null;

  const openZoneDetails = useCallback(
    (zoneId: string) => {
      const zone = zones.find((candidate) => candidate.id === zoneId);

      if (!zone) return;

      setSelectedZone(zone);
      setLocationsInsideZone(
        locations.filter((location) =>
          pointsInPolygon({ lat: location.lat, lng: location.lng }, zone.coordinates)
        )
      );
      setIsZoneDetailsOpen(true);
    },
    [zones, locations]
  );

  const handleLocationSelected = useCallback(
    (locationId: string) => {
      const location = locationsById[locationId];

      if (!location) return;

      if (selectedTool === 'none') {
        setSelectedLocation(location);
        setIsLocationDetailsOpen(true);
        return;
      }

      if (selectedTool !== 'relation') return;

      if (!relationSourceId) {
        setFirstRelationLocationId(location.id);
        return;
      }

      if (relationSourceId === location.id) return;

      const alreadyExists = relations.some(
        (relation) =>
          (relation.sourceId === relationSourceId && relation.targetId === location.id) ||
          (relation.sourceId === location.id && relation.targetId === relationSourceId)
      );

      if (alreadyExists) {
        setFirstRelationLocationId(null);
        return;
      }

      setPendingRelation({ sourceId: relationSourceId, targetId: location.id });
      setIsRelationModalOpen(true);
      setFirstRelationLocationId(null);
    },
    [locationsById, selectedTool, relationSourceId, relations]
  );

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      const feature = event.features?.[0];
      const layerId = feature?.layer.id;

      if (
        feature &&
        layerId === LAYER_IDS.locations &&
        (selectedTool === 'none' || selectedTool === 'relation')
      ) {
        handleLocationSelected(String(feature.properties.id));
        return;
      }

      // Durante o desenho de zona ou a criacao de location, um clique sobre
      // uma feicao existente continua valendo como clique de mapa.
      if (feature && selectedTool === 'none') {
        if (layerId === LAYER_IDS.zonesFill || layerId === LAYER_IDS.zonesLabel) {
          openZoneDetails(String(feature.properties.id));
          return;
        }

        if (layerId === LAYER_IDS.relationsLine || layerId === LAYER_IDS.relationsLabel) {
          setRelationPopup({
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
            name: String(feature.properties.name),
            sourceName: String(feature.properties.sourceName),
            targetName: String(feature.properties.targetName),
          });
          return;
        }
      }

      const { lat, lng } = event.lngLat;

      if (selectedTool === 'location') {
        setSelectedPosition({ lat, lng });
        setIsLocationModalOpen(true);
        return;
      }

      if (selectedTool === 'zone') {
        setDrawingCoordinates((previous) => [...previous, { lat, lng }]);
      }
    },
    [selectedTool, handleLocationSelected, openZoneDetails, setDrawingCoordinates]
  );

  const handleLoad = useCallback((event: MapEvent) => {
    setLabelAnchor(findFirstSymbolLayerId(event.target.getStyle()));
  }, []);

  const handleError = useCallback((event: ErrorEvent) => {
    console.error('Falha no mapa:', event.error);
  }, []);

  return (
    <div ref={containerRef} className="maplibre-map">
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE_URL}
        minZoom={2}
        cursor={cursor}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        onLoad={handleLoad}
        onClick={handleClick}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('auto')}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-left" />
        <ScaleControl position="bottom-right" />

        <ZonesLayer zones={zones} beforeId={labelAnchor} />
        <RelationsLayer
          relations={relations}
          locationsById={locationsById}
          beforeId={labelAnchor}
        />
        <DrawingZoneLayer
          coordinates={selectedTool === 'zone' ? drawingCoordinates : []}
          beforeId={labelAnchor}
        />
        <LocationsLayer
          locations={locations}
          selectedLocationId={relationSourceId ?? undefined}
          beforeId={labelAnchor}
        />

        {relationPopup && (
          <RelationPopup data={relationPopup} onClose={() => setRelationPopup(null)} />
        )}
      </Map>

      <CreateLocationModal
        open={isLocationModalOpen}
        position={selectedPosition}
        onCancel={() => setIsLocationModalOpen(false)}
        onLocationCreated={reloadLocations}
      />

      <CreateZoneModal
        open={isZoneModalOpen}
        onCancel={() => setIsZoneModalOpen(false)}
        onZoneCreated={async ({ name, color }) => {
          await zoneService.create({ name, color, coordinates: drawingCoordinates });
          await reloadZones();

          setDrawingCoordinates([]);
          setIsZoneModalOpen(false);
        }}
      />

      <CreateRelationModal
        open={isRelationModalOpen}
        onCancel={() => {
          setPendingRelation(null);
          setIsRelationModalOpen(false);
        }}
        onRelationCreated={async ({ name }) => {
          if (!pendingRelation) return;

          await relationService.create({
            name,
            sourceId: pendingRelation.sourceId,
            targetId: pendingRelation.targetId,
          });
          await reloadRelations();

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
    </div>
  );
}
