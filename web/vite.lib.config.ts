import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: ".",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "NakidkaCore",
      fileName: (format) => `nakidka-core.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["vscode"],
      output: {
        globals: {
          vscode: "vscode",
        },
      },
    },
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
