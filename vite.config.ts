import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  root: ".",

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
