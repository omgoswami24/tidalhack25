import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The src tree uses JSX inside .js files, so force the jsx loader for them.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
