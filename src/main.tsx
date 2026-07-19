import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { store, persistor } from './store/store'
import './index.css'
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
