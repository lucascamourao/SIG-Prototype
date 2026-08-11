'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { locationService } from '@/services/locationService';
import { relationService } from '@/services/relationService';
import { zoneService } from '@/services/zoneService';
import type { Location } from '@/types/location';
import type { Relation } from '@/types/relation';
import type { Zone } from '@/types/zone';

export function useMapData() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);

  const reloadLocations = useCallback(async () => {
    setLocations(await locationService.getAll());
  }, []);

  const reloadZones = useCallback(async () => {
    setZones(await zoneService.getAll());
  }, []);

  const reloadRelations = useCallback(async () => {
    setRelations(await relationService.getAll());
  }, []);

  useEffect(() => {
    async function loadAll() {
      await Promise.all([reloadLocations(), reloadZones(), reloadRelations()]);
    }

    void loadAll();
  }, [reloadLocations, reloadZones, reloadRelations]);

  const locationsById = useMemo(
    () => Object.fromEntries(locations.map((location) => [location.id, location])),
    [locations]
  );

  return {
    locations,
    zones,
    relations,
    locationsById,
    reloadLocations,
    reloadZones,
    reloadRelations,
  };
}
