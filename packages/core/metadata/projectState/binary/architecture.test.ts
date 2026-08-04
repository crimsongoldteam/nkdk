import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, it } from "vitest"

const metadataRoot = join(import.meta.dirname, "../..")

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

function source(relativePath: string): string {
  return readFileSync(join(metadataRoot, relativePath), "utf8")
}
