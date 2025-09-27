import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteSingleFile } from 'vite-plugin-singlefile'
import zipPack from 'vite-plugin-zip-pack'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile(), zipPack({ inDir: "temp" })],
  build: {
    minify: true,
    sourcemap: false,
    outDir: "temp",
    target: "es2018",
    rollupOptions: {
      input: 'playground.html'
    }
  },
  esbuild: {
    target: "es2018",
    include: /\.(ts|jsx|tsx)$/,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./assets"),
    },
  },
})
