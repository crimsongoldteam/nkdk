import UnpluginTypia from "@ryoppippi/unplugin-typia/vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), UnpluginTypia()],
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "jsdom",
    globals: true,
    watch: false,
  },
  resolve: {
    alias: {
      "~": resolve(process.cwd(), "./"),
    },
  },
})
