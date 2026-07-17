import { useEffect, useState, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

interface ExcalidrawTabProps {
  onSync: (elements: readonly any[], appState: any) => void;
  incomingElements: readonly any[] | null;
}

export function ExcalidrawTab({ onSync, incomingElements }: ExcalidrawTabProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isUpdatingFromRemote = useRef(false);

  useEffect(() => {
    if (excalidrawAPI && incomingElements) {
      isUpdatingFromRemote.current = true;
      excalidrawAPI.updateScene({ elements: incomingElements });
      // Reset after a short delay to prevent echo
      setTimeout(() => {
        isUpdatingFromRemote.current = false;
      }, 100);
    }
  }, [incomingElements, excalidrawAPI]);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (!isUpdatingFromRemote.current) {
      onSync(elements, appState);
    }
  };

  return (
    <div className="w-full h-full relative excalidraw-wrapper">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}
