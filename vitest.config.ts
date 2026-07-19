import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Unit tests only: no browser, no network, no running API. Anything that
    // needs those belongs in the end-to-end checks, which are run deliberately.
    testTimeout: 10_000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
