import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("projectValidationWorkerSchemaCache", () => {
  it("uses runtime schema cache for source TypeScript workers", async () => {
    const cache = await createProjectValidationWorkerSchemaCache({
      context,
      workerUrl: "file:///project/metadata/validation/projectValidationWorker.ts",
    })

    expect(cache.compileAll()).toEqual({
      formMs: expect.any(Number),
      propertiesMs: expect.any(Number),
      totalMs: expect.any(Number),
    })
  }, 120_000)
})
