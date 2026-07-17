import { useEffect, useState } from 'react';
import { Tldraw, useEditor, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';

interface WhiteboardTabProps {
  onSync: (data: any) => void;
  incomingPatch: any | null;
}

// Wrapper component to access the editor instance
function WhiteboardEvents({ onSync, incomingPatch }: WhiteboardTabProps) {
  const editor = useEditor();

  useEffect(() => {
    // Listen for local changes and send them
    const unlisten = editor.store.listen(
      (update) => {
        if (update.source === 'user') {
          onSync(update.changes);
        }
      },
      { scope: 'document' } // Only listen to document changes, not presence/ui
    );
    return () => unlisten();
  }, [editor, onSync]);

  useEffect(() => {
    // Apply incoming patches
    if (incomingPatch) {
      editor.store.mergeRemoteChanges(() => {
        const { added, updated, removed } = incomingPatch;
        
        // added and updated are objects like { [id]: record }
        const toPut = [
          ...Object.values(added || {}),
          ...Object.values(updated || {}).map((u: any) => u[1]) // updated is [from, to]
        ];
        
        if (toPut.length > 0) {
          editor.store.put(toPut as any);
        }
        
        // removed is { [id]: record }
        const toRemove = Object.keys(removed || {});
        if (toRemove.length > 0) {
          editor.store.remove(toRemove as any);
        }
      });
    }
  }, [incomingPatch, editor]);

  return null;
}

export function WhiteboardTab({ onSync, incomingPatch }: WhiteboardTabProps) {
  // Use a stable store instance
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));

  return (
    <div className="w-full h-full relative">
      <Tldraw store={store}>
        <WhiteboardEvents onSync={onSync} incomingPatch={incomingPatch} />
      </Tldraw>
    </div>
  );
}
