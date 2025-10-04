import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    watch: {},
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "NakidkaCore",
      fileName: (format) => `nakidka-core.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["vscode"],
      input: {
        main: resolve(__dirname, "index.html"),
        lib: resolve(__dirname, "lib/index.ts"),
      },
      output: {
        globals: {
          vscode: "vscode",
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./"),
    },
  },
  define: {
    global: "globalThis",
  },
})
