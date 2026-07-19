import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { createImportTempRoot, importWorkerTempDir } from "./tempDirectory"

describe("XML import temporary directories", () => {
  it("places an operation root under the project .nkdk directory", () => {
    expect(createImportTempRoot("relative-project", "import_2026-07-19")).toBe(
      join(resolve("relative-project"), ".nkdk", "tmp", "import", "import_2026-07-19")
    )
  })

  it.each(["", "../outside", "nested/operation", "operation with spaces"])(
    "rejects an invalid operation id %j",
    (operationId) => {
      expect(() => createImportTempRoot("project", operationId)).toThrow("Некорректный operationId")
    }
  )

  it("creates a stable directory name for each worker", () => {
    expect(importWorkerTempDir("/tmp/import-operation", 7)).toBe(join("/tmp/import-operation", "worker-7"))
  })

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects an invalid worker index %s", (workerIndex) => {
    expect(() => importWorkerTempDir("/tmp/import-operation", workerIndex)).toThrow("Некорректный workerIndex")
  })
})
