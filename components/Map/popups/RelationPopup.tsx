'use client';

import { Popup } from 'react-map-gl/maplibre';

export type RelationPopupData = {
  longitude: number;
  latitude: number;
  name: string;
  sourceName: string;
  targetName: string;
};

type Props = {
  data: RelationPopupData;
  onClose: () => void;
};

export default function RelationPopup({ data, onClose }: Props) {
  return (
    <Popup
      longitude={data.longitude}
      latitude={data.latitude}
      anchor="bottom"
      closeOnClick={false}
      onClose={onClose}
    >
      <strong>{data.name}</strong>
      <div>
        {data.sourceName} &rarr; {data.targetName}
      </div>
    </Popup>
  );
}
