import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  root: ".",

  server: {
    port: 3000,
    host: true,
    fs: {
      // Разрешаем доступ к node_modules для Monaco Editor worker'ов
      allow: [".."],
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
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        playground: resolve(__dirname, "playground.html"),
      },
    },
  },
  optimizeDeps: {
    // Исключаем Monaco Editor из предварительной оптимизации
    exclude: ["monaco-editor"],
  },
})
