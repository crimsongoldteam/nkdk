import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { createLocalConfigurationIndexReader } from "./localReader"
import { getConfigurationIndexChildren } from "./referenceView"

describe("getConfigurationIndexChildren", () => {
  it("reads children through the export runtime", () => {
    const runtime = createConfigurationIndexExportRuntime({
      source: createLocalConfigurationIndexReader(new Map([["А.yaml", { entities: [{
        logicalAddress: "Документ.Заказ",
        children: [{ xmlName: "Form", name: "Форма" }],
      }] }]])),
      collector: createConfigurationIndexCollector(),
      targetProjectPath: "А.yaml",
      logicalAddress: "Документ.Заказ",
      operationSeed: new Uint8Array(32),
    })
    const context = { exportToXML: { configurationIndex: runtime } } as never
    expect(getConfigurationIndexChildren(context)).toEqual([{ xmlName: "Form", name: "Форма" }])
  })
})
