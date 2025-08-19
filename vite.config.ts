import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'services/__tests__/**/*.test.ts',
      'services/__tests__/**/*.test.tsx',
      'store/__tests__/**/*.test.ts',
      'store/__tests__/**/*.test.tsx',
      'app/components/__tests__/**/*.test.ts',
      'app/components/__tests__/**/*.test.tsx',
      'app/**/__tests__/**/*.test.ts',
      'app/**/__tests__/**/*.test.tsx',
      'utils/__tests__/**/*.test.ts',
      'utils/__tests__/**/*.test.tsx'
    ],
  },
});
