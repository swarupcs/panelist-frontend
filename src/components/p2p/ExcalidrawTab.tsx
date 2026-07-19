import { useEffect, useState, useRef, useCallback } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';

interface ExcalidrawTabProps {
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSync: (elements: readonly any[], appState: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingElements: readonly any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPointerSync?: (pointer: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingPointer?: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setApi?: (api: any) => void;
}

export function ExcalidrawTab({ onSync, incomingElements, onPointerSync, incomingPointer, setApi }: ExcalidrawTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (elements: readonly any[], appState: any) => {
    if (!isUpdatingFromRemote.current) {
      onSync(elements, appState);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerUpdate = useCallback((payload: any) => {
    if (onPointerSync) {
      onPointerSync(payload.pointer);
    }
  }, [onPointerSync]);

  return (
    // Absolute rather than h-full: Excalidraw's root is height:100%, which
    // resolves to 0 unless every ancestor has a definite height. Filling the
    // (already relative) parent takes the height from its used size instead,
    // so the canvas cannot silently collapse the way the interview one did.
    <div className="absolute inset-0 excalidraw-wrapper">
      <Excalidraw
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          if (setApi) setApi(api);
        }}
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
