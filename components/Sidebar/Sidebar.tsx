'use client';

import { Tool } from '@/types/tool';

import { Layout, Typography } from 'antd';
import Actions from './Actions';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  canFinishZone: boolean;
  onFinishZone: () => void;
}

export default function Sidebar({
  selectedTool,
  onToolChange,
  canFinishZone,
  onFinishZone,
}: SidebarProps) {
  return (
    <Sider
      width={300}
      theme="light"
      style={{
        padding: 16,
        borderRight: '1px solid #b1b1b1',
      }}
    >
      <Title level={4}>Prototype GIS</Title>

      <Actions
        selectedTool={selectedTool}
        onToolChange={onToolChange}
        canFinishZone={canFinishZone}
        onFinishZone={onFinishZone}
      />
    </Sider>
  );
}
