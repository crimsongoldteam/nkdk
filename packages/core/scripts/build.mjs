import esbuild from "esbuild"
import { rm } from "node:fs/promises"

const outdir = new URL("../dist/", import.meta.url)
const rootDir = new URL("../", import.meta.url)

await rm(outdir, { force: true, recursive: true })

const commonOptions = {
  absWorkingDir: rootDir.pathname,
  bundle: true,
  external: [
    "@node-rs/xxhash",
    "ajv",
    "ajv-formats",
    "date-fns",
    "fast-xml-parser",
    "js-yaml",
    "p-limit",
    "piscina",
    "typebox",
    "uuid",
  ],
  format: "esm",
  logLevel: "info",
  platform: "node",
  sourcemap: false,
  target: "node26",
}

await esbuild.build({
  ...commonOptions,
  entryPoints: ["index.ts"],
  outfile: new URL("index.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/project/preparedYamlProjectWorker.ts"],
  outfile: new URL("preparedYamlProjectWorker.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/validation/generateProjectValidationAjvStandalone.ts"],
  outfile: new URL("generateProjectValidationAjvStandalone.js", outdir).pathname,
})

const { generateProjectValidationAjvStandalone } = await import(
  new URL("generateProjectValidationAjvStandalone.js", outdir).href
)

await generateProjectValidationAjvStandalone({
  outfile: new URL("projectValidationAjvStandalone.js", outdir).pathname,
})
