import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { store, persistor } from './store/store'
import './index.css'
// Excalidraw ships its own stylesheet and renders as an unusable pile of
// unstyled buttons without it. It was previously imported inside a single
// component, which meant the whiteboard was styled on the interview page and
// broken in the P2P room — the two live on separately code-split routes, so
// whether the stylesheet had loaded depended on which page you happened to
// visit first. Importing it at the entry makes that impossible to get wrong.
import '@excalidraw/excalidraw/index.css'
import App from './App.tsx'

// Use the locally bundled Monaco runtime. The wrapper otherwise loads it from a
// CDN, leaving the interview editor blank whenever that request is unavailable.
loader.config({ monaco })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
