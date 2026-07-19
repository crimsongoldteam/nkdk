import esbuild from "esbuild"
import { chmod, cp, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, "..")
const repoRoot = join(packageRoot, "../..")
const distDir = join(packageRoot, "dist")
const binDir = join(distDir, "bin")
const binFile = join(binDir, "nkdk-mcp")
const packageJson = (
  await import(pathToFileURL(join(packageRoot, "package.json")).href, {
    with: { type: "json" },
  })
).default
const corePackageJson = (
  await import(pathToFileURL(join(repoRoot, "packages/core/package.json")).href, {
    with: { type: "json" },
  })
).default

await rm(distDir, { force: true, recursive: true })
await mkdir(binDir, { recursive: true })

const commonOptions = {
  absWorkingDir: repoRoot,
  bundle: true,
  external: [
    "@modelcontextprotocol/sdk",
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
    "zod",
  ],
  format: "esm",
  logLevel: "info",
  platform: "node",
  sourcemap: false,
  target: "node26",
  tsconfig: join(repoRoot, "tsconfig.build.json"),
  define: {
    __NKDK_CORE_VERSION__: JSON.stringify(corePackageJson.version),
    __NKDK_MCP_VERSION__: JSON.stringify(packageJson.version),
  },
}

await esbuild.build({
  ...commonOptions,
  banner: { js: "#!/usr/bin/env node" },
  entryPoints: [join(packageRoot, "src/server.ts")],
  outfile: binFile,
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/project/preparedYamlProjectWorker.ts")],
  outfile: join(distDir, "preparedYamlProjectWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/importFromXml/worker.ts")],
  outfile: join(distDir, "importFromXmlWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts")],
  outfile: join(distDir, "generateProjectValidationAjvStandalone.js"),
})

const { generateProjectValidationAjvStandalone } = await import(
  pathToFileURL(join(distDir, "generateProjectValidationAjvStandalone.js")).href
)

await generateProjectValidationAjvStandalone({
  outfile: join(distDir, "projectValidationAjvStandalone.js"),
})

await chmod(binFile, 0o755)
await cp(join(repoRoot, "README.md"), join(packageRoot, "README.md"))
await cp(join(repoRoot, "LICENSE"), join(packageRoot, "LICENSE"))
