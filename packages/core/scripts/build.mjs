import esbuild from "esbuild"
import { rm } from "node:fs/promises"

const outdir = new URL("../dist/", import.meta.url)
const rootDir = new URL("../", import.meta.url)
const corePackageJson = (
  await import(new URL("../package.json", import.meta.url), {
    with: { type: "json" },
  })
).default
await rm(outdir, { force: true, recursive: true })

const commonOptions = {
  absWorkingDir: rootDir.pathname,
  bundle: true,
  external: [
    "@node-rs/xxhash",
    "date-fns",
    "fast-xml-parser",
    "js-yaml",
    "p-limit",
    "piscina",
    "structurae",
    "typebox",
    "uuid",
  ],
  format: "esm",
  logLevel: "info",
  platform: "node",
  sourcemap: false,
  target: "node26",
  define: {
    __NKDK_CORE_VERSION__: JSON.stringify(corePackageJson.version),
  },
}

await esbuild.build({
  ...commonOptions,
  entryPoints: ["index.ts"],
  outfile: new URL("index.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/composition/workers/preparedYamlProject.ts"],
  outfile: new URL("preparedYamlProjectWorker.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/composition/workers/importFromXml.ts"],
  outfile: new URL("importFromXmlWorker.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/composition/workers/fullSyncToXml.ts"],
  outfile: new URL("fullSyncToXmlWorker.js", outdir).pathname,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/composition/workers/generic.ts"],
  outfile: new URL("worker.js", outdir).pathname,
})
