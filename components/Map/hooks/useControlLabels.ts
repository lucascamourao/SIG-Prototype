'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

const CONTROL_LABELS: Record<string, string> = {
  '.maplibregl-ctrl-zoom-in': 'Aumentar zoom',
  '.maplibregl-ctrl-zoom-out': 'Diminuir zoom',
  '.maplibregl-ctrl-compass': 'Rotacionar',
};

// O MapLibre nao expoe API de i18n para os controles. A busca fica presa ao
// container do mapa para nao alcancar outros controles da pagina.
export function useControlLabels(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    for (const [selector, label] of Object.entries(CONTROL_LABELS)) {
      const button = container.querySelector<HTMLButtonElement>(selector);

      if (!button) continue;

      button.title = label;
      button.setAttribute('aria-label', label);
    }
  });
}
