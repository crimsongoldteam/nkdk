import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
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
