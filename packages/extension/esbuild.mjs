//@ts-check
/// <reference path="./esbuild.env.d.ts" />
import * as esbuild from "esbuild"
import { createRequire } from "module"
import * as path from "path"
import { fileURLToPath } from "url"

// @ts-ignore — ESM: import.meta разрешён при module NodeNext (tsconfig.esbuild.json)
const _url = import.meta.url
const __dirname = path.dirname(fileURLToPath(_url))
const requireResolve = createRequire(_url).resolve

const watch = process.argv.includes("--watch")
const minify = process.argv.includes("--minify")

/** Как в webpack monaco-yaml: UMD → ESM для vscode-json-languageservice (alias lib/umd → lib/esm), чтобы всё бандлилось. */
function resolveUmdToEsmPlugin() {
  return {
    name: "umd-to-esm",
    setup(build) {
      build.onResolve({ filter: /vscode-json-languageservice.*[\\/]umd[\\/]/ }, (args) => {
        const esmPath = args.path.replace(/[\\/]umd[\\/]/g, "/esm/")
        const resolveDir = args.importer ? path.dirname(args.importer) : __dirname
        const absPath = requireResolve(esmPath, { paths: [resolveDir] })
        return { path: absPath }
      })
    },
  }
}

;(async () => {
  const ctx = await esbuild.context({
    // Entry points for the VS Code extension and YAML language server
    entryPoints: {
      extension: "src/extension/main.ts",
      "yaml-language-server": "node_modules/yaml-language-server/out/server/src/server.js",
    },

    outdir: "./out/extension",
    bundle: true,
    target: "es2020",
    mainFields: ["module", "main"],
    format: "cjs",
    outExtension: { ".js": ".cjs" },
    loader: { ".ts": "ts" },
    external: ["vscode"],
    platform: "node",
    sourcemap: !minify,
    minify,
    plugins: [resolveUmdToEsmPlugin()],
  })

  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    ctx.dispose()
  }
})()
