import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, it } from "vitest"

const metadataRoot = join(import.meta.dirname, "../..")
const runtimeMetadataRoot = join(import.meta.dirname, "../../../../runtime/metadata")

it("не возвращает старый объектный протокол в рабочих путях validation и import", () => {
  const importWorker = source("importFromXml/worker.ts")
  const importPool = source("importFromXml/workerPool.ts")
  const refreshPool = source("project/preparedYamlProjectWorkerPool.ts")
  const projectFiles = source("projectState/projectFiles.ts")

  expect(importWorker).not.toContain("binary/contribution")
  expect(importWorker).not.toContain("indexBatches")
  expect(importWorker).not.toContain("finalStateBatches")
  expect(importPool).not.toContain("indexBatches")
  expect(importPool).not.toContain("finalStateBatches")
  expect(refreshPool).toContain("AsyncIterable<ProjectStateValidationFileBatch>")
  expect(projectFiles).toContain("async function* discoverProjectStateValidationFileBatches")
})

it("не сохраняет неизменившийся снимок", () => {
  const writer = source("projectState/writerHandle.ts")
  expect(writer).toContain("if (changed) scheduleSave")
})

it("не восстанавливает полные локальные lookup-структуры в full sync worker", () => {
  const composition = source("fullSyncToXml/sharedMetadata.ts")
  const worker = source("fullSyncToXml/worker.ts")
  const configurationIndex = sourceRuntime("configurationIndex/fragment.ts")

  expect(worker).not.toContain("composition.assignments()")
  expect(configurationIndex).not.toContain("private stringIds?: Map")
  expect(configurationIndex).not.toContain("fileOffsetByPathId?: Map")
  expect(configurationIndex).not.toContain("entityOffsetByAddressId?: Map")
  expect(configurationIndex).not.toContain("entityOffsetsBySourcePathId?: Map")
  expect(composition).toContain("findBinaryHashIndex")
})

function source(relativePath: string): string {
  return readFileSync(join(metadataRoot, relativePath), "utf8")
}

function sourceRuntime(relativePath: string): string {
  return readFileSync(join(runtimeMetadataRoot, relativePath), "utf8")
}
