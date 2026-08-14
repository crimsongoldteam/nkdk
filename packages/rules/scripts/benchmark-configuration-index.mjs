import { readdir, stat } from "node:fs/promises"
import { resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { createMetadataRuntime } from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  openConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import { metadataRules } from "../metadata/composition/metadataRules.ts"

const args = process.argv[2] === "--" ? process.argv.slice(3) : process.argv.slice(2)
const [xmlInput, projectInput] = args
if (xmlInput === undefined || projectInput === undefined || args.length !== 2) {
  throw new Error("Использование: benchmark-configuration-index.mjs <xmlDir> <projectDir>")
}

const xmlDir = resolve(xmlInput)
const projectDir = resolve(projectInput)
const projectEntries = await readdir(projectDir)
if (projectEntries.length !== 0) throw new Error(`Каталог проекта должен быть пустым: ${projectDir}`)

const runtime = createMetadataRuntime({
  rules: metadataRules,
  workers: {
    preparedYamlProject: new URL("../metadata/composition/workers/preparedYamlProject.ts", import.meta.url),
    importFromXml: new URL("../metadata/composition/workers/importFromXml.ts", import.meta.url),
    fullSyncToXml: new URL("../metadata/composition/workers/fullSyncToXml.ts", import.meta.url),
    generic: new URL("../metadata/composition/workers/generic.ts", import.meta.url),
  },
})
const projectState = runtime.projects.createState()
const importStarted = performance.now()
let importResult
try {
  importResult = await runtime.import.configurationFromXml({
    context: {
      defaultLanguage: "ru",
      version: "2.20",
      exportToYAML: { toTyped: false },
      fromXML: { forReference: false },
    },
    inputDir: xmlDir,
    projectDir,
    projectState,
    operationId: "configuration-index-benchmark",
  })
} finally {
  await runtime.close()
}
const importMs = performance.now() - importStarted
if (importResult.failed.length !== 0 || importResult.componentPath === undefined) {
  throw new Error(`Импорт завершился с ошибками: ${JSON.stringify(importResult.failed)}`)
}

const address = importResult.componentPath === "cf"
  ? { kind: "configuration" }
  : { kind: "configurationExtension", name: importResult.componentPath.slice("cfe/".length) }
const descriptor = configurationIndexStoreDescriptor(projectDir, address)
const dataBytes = (await stat(descriptor.dataPath)).size
const store = openConfigurationIndexStore(descriptor, "readWrite")

try {
  const hashes = store.readHashes()
  const blocks = store.getBlocks(hashes.map(({ projectPath }) => projectPath))
  const blockKeys = [...blocks.keys()]
  if (blockKeys.length === 0) throw new Error("Импортированный снимок не содержит блоков")

  const sizes = [
    { name: "1", count: 1 },
    { name: "10", count: Math.min(10, blockKeys.length) },
    { name: "10%", count: Math.max(1, Math.ceil(blockKeys.length * 0.1)) },
  ]
  const pending = []
  let revision = 1n
  for (const size of sizes) {
    const durations = []
    for (let iteration = 0; iteration < 5; iteration += 1) {
      const selected = blockKeys.slice(0, size.count)
      const currentHashes = new Map(store.readHashes().map((entry) => [entry.projectPath, entry.contentHash]))
      const delta = {
        hashes: new Map(selected.map((projectPath) => [
          projectPath,
          { kind: "put", contentHash: (currentHashes.get(projectPath) ?? 0n) + revision },
        ])),
        blocks: new Map(selected.map((projectPath) => [
          projectPath,
          { kind: "put", block: blocks.get(projectPath) },
        ])),
      }
      revision += 1n

      const started = performance.now()
      await store.writePending(delta)
      await store.applyPending()
      await store.clearPending()
      durations.push(performance.now() - started)
    }
    pending.push({ name: size.name, keys: size.count, medianMs: median(durations) })
  }

  const report = {
    xmlDir,
    projectDir,
    componentPath: importResult.componentPath,
    import: { wallMs: importMs, dataBytes, hashes: hashes.length, blocks: blocks.size },
    pending,
  }
  process.stderr.write(
    `Импорт: ${importMs.toFixed(2)} мс, LMDB: ${dataBytes} байт, блоков: ${blocks.size}\n` +
    pending.map(({ name, keys, medianMs }) =>
      `Pending ${name} (${keys} ключей): медиана ${medianMs.toFixed(2)} мс`).join("\n") + "\n",
  )
  process.stdout.write(`${JSON.stringify(report)}\n`)
} finally {
  await store.close()
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}
