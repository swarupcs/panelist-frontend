import { useEffect, useState, useRef, useCallback } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';

interface ExcalidrawTabProps {
  onSync: (elements: readonly any[], appState: any) => void;
  incomingElements: readonly any[] | null;
  onPointerSync?: (pointer: any) => void;
  incomingPointer?: any | null;
}

export function ExcalidrawTab({ onSync, incomingElements, onPointerSync, incomingPointer }: ExcalidrawTabProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isUpdatingFromRemote = useRef(false);
  const [collaborators, setCollaborators] = useState(new Map());

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

  useEffect(() => {
    if (excalidrawAPI && incomingPointer) {
      setCollaborators(new Map([
        ['peer', {
          pointer: incomingPointer,
          button: 'up',
          selectedElementIds: {},
          username: 'Peer'
        }]
      ]));
    }
  }, [incomingPointer, excalidrawAPI]);

  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ collaborators });
    }
  }, [collaborators, excalidrawAPI]);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (!isUpdatingFromRemote.current) {
      onSync(elements, appState);
    }
  };

  const handlePointerUpdate = useCallback((payload: any) => {
    if (onPointerSync) {
      onPointerSync(payload.pointer);
    }
  }, [onPointerSync]);

  return (
    <div className="w-full h-full relative excalidraw-wrapper">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false, // We sync it ourselves
          }
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
}
