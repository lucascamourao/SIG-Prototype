'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <p>Carregando mapa...</p>,
});

export default MapView;
