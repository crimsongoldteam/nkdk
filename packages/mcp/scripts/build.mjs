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
  await import(pathToFileURL(join(repoRoot, "packages/rules/package.json")).href, {
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
    "@nkdk/project-state-native",
    "@node-rs/xxhash",
    "date-fns",
    "fast-xml-parser",
    "js-yaml",
    "p-limit",
    "piscina",
    "ssh2",
    "structurae",
    "typebox",
    "uuid",
    "yaml",
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
  entryPoints: [fileURLToPath(import.meta.resolve("@nkdk/rules/workers/prepared-yaml"))],
  outfile: join(binDir, "preparedYamlProjectWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [fileURLToPath(import.meta.resolve("@nkdk/rules/workers/import"))],
  outfile: join(binDir, "importFromXmlWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [fileURLToPath(import.meta.resolve("@nkdk/rules/workers/sync"))],
  outfile: join(binDir, "fullSyncToXmlWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [fileURLToPath(import.meta.resolve("@nkdk/rules/workers/generic"))],
  outfile: join(binDir, "worker.js"),
})

await chmod(binFile, 0o755)
await cp(join(repoRoot, "README.md"), join(packageRoot, "README.md"))
await cp(join(repoRoot, "LICENSE"), join(packageRoot, "LICENSE"))
