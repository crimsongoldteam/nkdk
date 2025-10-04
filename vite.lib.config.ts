import { defineConfig } from "vite"
import { resolve } from "path"
import dts from "vite-plugin-dts"

export default defineConfig({
  root: ".",
  plugins: [dts()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "NakidkaCore",
      fileName: (format) => `nakidka-core.${format}.js`,
      formats: ["es", "umd"],
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
