import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Relative base so the built `dist/` folder works from any static host or subfolder.
  base: './',
  test: {
    environment: 'node',
  },
});
