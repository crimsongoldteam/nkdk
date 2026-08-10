import { describe, expect, it } from "vitest"

import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { createMetadataRuntime } from "./createMetadataRuntime"

const workers = {
  preparedYamlProject: new URL("file:///test/prepared.js"),
  importFromXml: new URL("file:///test/import.js"),
  fullSyncToXml: new URL("file:///test/sync.js"),
  generic: new URL("file:///test/generic.js"),
}

describe("createMetadataRuntime", () => {
  it("binds project state to the generic worker entrypoint", async () => {
    const runtime = createMetadataRuntime({
      rules: emptyMetadataRules,
      workers,
      createWorkerPool(workerUrl) {
        const size = workerUrl === workers.generic ? 17 : -1
        return {
          async beginOperation() { throw new Error("not used") },
          async installProjectState() {},
          async clearProjectState() {},
          size: () => size,
          async close() {},
        }
      },
    })

    const state = runtime.projects.createState()
    expect(state.workers.size()).toBe(17)
    await runtime.close()
  })

  it("exposes the grouped services used by the composition root", async () => {
    const runtime = createMetadataRuntime({ rules: emptyMetadataRules, workers })

    expect(runtime.projects.parsePath("cf", { allowRoot: true })).toBe("cf")
    expect(runtime.schemas.exportByName).toBeTypeOf("function")
    expect(runtime.import.configurationFromXml).toBeTypeOf("function")
    expect(runtime.sync.planToXml).toBeTypeOf("function")
    expect(runtime.metadata.rename).toBeTypeOf("function")
    expect(runtime.metadata.findReferences).toBeTypeOf("function")

    await runtime.close()
  })

  it("isolates project state ownership and closes owned state once", async () => {
    const first = createMetadataRuntime({ rules: emptyMetadataRules, workers })
    const second = createMetadataRuntime({ rules: emptyMetadataRules, workers })
    const state = first.projects.createState()

    await expect(
      second.validation.validateProject({ projectDir: "test", projectState: state }),
    ).rejects.toThrow("другому runtime")

    await first.close()
    await first.close()
    await expect(state.rebuild({ projectDir: "test" })).rejects.toThrow("закрыт")
    await second.close()
  })
})
