import * as path from "path"
import { defineConfig } from "vite"

export default defineConfig((api) => {
  const isDev = api.mode === "development"

  return {
    build: {
      minify: !isDev,
      sourcemap: isDev,
      target: "es2020",
      rollupOptions: {
        input: {
          playground: path.resolve(__dirname, "./index.html"),
        },
      },
    },
    esbuild: {
      // Configure this value when the browser version of the development environment is lower
      target: "es2020",
      include: /\.(ts|jsx|tsx)$/,
    },
    plugins: [],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./"),
      },
    },
    server: {
      open: "/index.html",
    },
  }
})
