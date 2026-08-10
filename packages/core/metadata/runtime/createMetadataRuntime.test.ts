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
