import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import typia from "@ryoppippi/unplugin-typia"

export default defineConfig({
  plugins: [react(), typia.vite()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitestSetup.ts"],
    globals: true,
    watch: false,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./"),
    },
  },
})
