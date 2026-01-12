import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['apps/web/src/server/**/*.test.ts'],
    clearMocks: true,
    globals: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
    },
  },
});
