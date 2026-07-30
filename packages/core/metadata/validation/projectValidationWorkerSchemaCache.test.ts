import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("projectValidationWorkerSchemaCache", () => {
  it("requires a standalone schema module next to a compiled worker", async () => {
    await expect(
      createProjectValidationWorkerSchemaCache({
        context,
        workerUrl: "file:///missing/projectValidationWorker.js",
      })
    ).rejects.toThrow("Standalone validation schema module was not found next to worker")
  })
})
