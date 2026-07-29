import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { isConfigurationIndexPropertyPresent } from "./referenceView"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleIndex } from "./testData"

describe("isConfigurationIndexPropertyPresent", () => {
  it("does not treat order as property presence", () => {
    const runtime = createConfigurationIndexExportRuntime({
      source: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))),
      collector: createConfigurationIndexCollector(),
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context = { exportToXML: { configurationIndex: runtime } } as never

    expect(isConfigurationIndexPropertyPresent(context, "name")).toBe(true)
    expect(isConfigurationIndexPropertyPresent(context, "synonym")).toBe(false)
  })
})
