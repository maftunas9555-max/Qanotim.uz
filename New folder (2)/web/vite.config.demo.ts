import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds demo.html into one self-contained HTML file (JS/CSS inlined) with
// window.__QN_MOCK__ set, so it can be opened directly via file:// with no
// server. Same UI code as the real app — see web/src/mock/mockBackend.ts.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-demo',
    rollupOptions: {
      input: 'demo.html',
    },
    cssCodeSplit: false,
  },
});
