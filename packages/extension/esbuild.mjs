//@ts-check
/// <reference path="./esbuild.env.d.ts" />
import * as esbuild from "esbuild"

const watch = process.argv.includes("--watch")
const minify = process.argv.includes("--minify")

const success = watch ? "Watch build succeeded" : "Build succeeded"

;(async () => {
  const ctx = await esbuild.context({
    // Entry points for the vscode extension and the language server
    entryPoints: {
      extension: "src/extension/main.ts",
      language: "src/language/main.ts",
      "yaml-language-server": "node_modules/yaml-language-server/out/server/src/server.js",
    },
    outdir: "./out/extension",
    bundle: true,
    target: "es2020",
    // VSCode's extension host is still using cjs, so we need to transform the code
    format: "cjs",
    // To prevent confusing node, we explicitly use the `.cjs` extension
    outExtension: {
      ".js": ".cjs",
    },
    loader: { ".ts": "ts" },
    external: ["vscode"],
    platform: "node",
    sourcemap: !minify,
    minify,
  })

  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    ctx.dispose()
  }
})()
