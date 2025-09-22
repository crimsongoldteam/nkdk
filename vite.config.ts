/// <reference types="vitest/config" />
import { defineConfig } from "vite"
import * as path from "path"

export default defineConfig((api) => {
  return {
    test: {
      isolate: false,
      globals: true,
      environment: "node",
      setupFiles: ["./tests/setup.ts"],
      coverage: {
        enabled: true,
        provider: "v8",
        exclude: [
          ".yarn/**",
          "temp/**",
          "node_modules/**",
          "tests/**",
          "dist/**",
          "vitest.config.ts",
          "vite.config.ts",
          "vite.config.playground.ts",
        ],
      },
    },

    build: {
      minify: true,
      sourcemap: false,
      outDir: "temp",
      target: "es2018",
    },
    esbuild: {
      target: "es2018",
      include: /\.(ts|jsx|tsx)$/,
    },

    plugins: [],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./assets"),
      },
    },
  }
})
