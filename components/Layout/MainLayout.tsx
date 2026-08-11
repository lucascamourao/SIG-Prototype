'use client'; // virou client component

import { Layout } from 'antd';
import { useState } from 'react';

import Sidebar from '../Sidebar/Sidebar';
import Map from '../Map';

import { Tool } from '@/types/tool';
import { Coordinate } from '@/types/coordinate';

export default function MainLayout() {
  const [selectedTool, setSelectedTool] = useState<Tool>('none');

  const [drawingCoordinates, setDrawingCoordinates] = useState<Coordinate[]>([]);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        canFinishZone={drawingCoordinates.length >= 3}
        onFinishZone={() => setIsZoneModalOpen(true)}
      />

      <Layout.Content style={{ height: '100vh' }}>
        <Map
          selectedTool={selectedTool}
          drawingCoordinates={drawingCoordinates}
          setDrawingCoordinates={setDrawingCoordinates}
          isZoneModalOpen={isZoneModalOpen}
          setIsZoneModalOpen={setIsZoneModalOpen}
        />
      </Layout.Content>
    </Layout>
  );
}
