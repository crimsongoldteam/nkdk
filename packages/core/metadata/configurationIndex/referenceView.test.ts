import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { getConfigurationIndexOmittedChildren } from "./referenceView"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleSnapshot } from "./testData"

describe("getConfigurationIndexOmittedChildren", () => {
  it("reads omitted children through the export runtime", () => {
    const runtime = createConfigurationIndexExportRuntime({
      source: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))),
      collector: createConfigurationIndexCollector(),
      targetProjectPath: "Документы/Заказ.yaml",
      logicalAddress: "Документ.Заказ",
    })
    const context = { exportToXML: { configurationIndex: runtime } } as never

    expect(getConfigurationIndexOmittedChildren(context)).toEqual({
      kind: "names",
      names: ["Форма", "Макет"],
    })
  })
})
