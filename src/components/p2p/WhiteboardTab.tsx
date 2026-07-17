import { useEffect, useState } from 'react';
import { Tldraw, useEditor, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';

interface WhiteboardTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSync: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingPatch: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEditor?: (editor: any) => void;
}

// Wrapper component to access the editor instance
function WhiteboardEvents({ onSync, incomingPatch, setEditor }: WhiteboardTabProps) {
  const editor = useEditor();

  useEffect(() => {
    if (setEditor) setEditor(editor);
  }, [editor, setEditor]);

  useEffect(() => {
    // Listen for local changes and send them
    const unlisten = editor.store.listen(
      (update) => {
        if (update.source === 'user') {
          const { added, updated, removed } = update.changes;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filtered: any = { added: {}, updated: {}, removed: {} };
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isSyncable = (record: any) => {
            return record && (
              record.typeName === 'shape' ||
              record.typeName === 'binding' ||
              record.typeName === 'asset' ||
              record.typeName === 'instance_presence'
            );
          };

          for (const [id, record] of Object.entries(added)) {
            if (isSyncable(record)) filtered.added[id] = record;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const [id, [from, to]] of Object.entries(updated as Record<string, any>)) {
            if (isSyncable(to)) filtered.updated[id] = [from, to];
          }
          for (const [id, record] of Object.entries(removed)) {
            if (id.startsWith('shape:') || id.startsWith('binding:') || id.startsWith('asset:') || id.startsWith('instance_presence:')) {
              filtered.removed[id] = record;
            }
          }
          
          if (Object.keys(filtered.added).length || Object.keys(filtered.updated).length || Object.keys(filtered.removed).length) {
            onSync(filtered);
          }
        }
      },
      { scope: 'all' } // Listen to all, then filter
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...Object.values(updated || {}).map((u: any) => u[1]) // updated is [from, to]
        ];
        
        if (toPut.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          editor.store.put(toPut as any);
        }
        
        // removed is { [id]: record }
        const toRemove = Object.keys(removed || {});
        if (toRemove.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          editor.store.remove(toRemove as any);
        }
      });
    }
  }, [incomingPatch, editor]);

  return null;
}

export function WhiteboardTab({ onSync, incomingPatch, setEditor }: WhiteboardTabProps) {
  // Use a stable store instance
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));

  return (
    <div className="w-full h-full relative">
      <Tldraw store={store}>
        <WhiteboardEvents onSync={onSync} incomingPatch={incomingPatch} setEditor={setEditor} />
      </Tldraw>
    </div>
  );
}
