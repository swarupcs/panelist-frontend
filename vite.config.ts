import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  // Pinned rather than left on Vite's default 5173.
  //
  // Windows reserves TCP 5080-5179 (see `netsh interface ipv4 show
  // excludedportrange protocol=tcp`), so 5173 fails with EACCES on this
  // machine. More importantly the port is not a local preference: the backend
  // builds OAuth redirects and password-reset links from FRONTEND_URL, and
  // Google rejects a redirect URI that does not match its registered origin
  // exactly. A drifting dev port breaks sign-in, so it is fixed here.
  server: { port: 5199, strictPort: true },

  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
