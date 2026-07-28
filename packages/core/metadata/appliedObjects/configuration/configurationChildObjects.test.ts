import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import { configurationChildObjectsFromIndex } from "./configurationChildObjects"

describe("configurationChildObjectsFromIndex", () => {
  it("переносит порядок ChildObjects в следующий снимок", () => {
    const order = [
      JSON.stringify(["Language", "Русский"]),
      JSON.stringify(["Language", "Английский"]),
      JSON.stringify(["Catalog", "Товары"]),
    ]
    const source = createConfigurationIndexReader(
      snapshotConfigurationIndex(
        encodeConfigurationIndex({
          ...sampleIndex(),
          xmlNodes: [{
            logicalAddress: "Конфигурация.Свойство.childObjects",
            order,
          }],
        })
      )
    )
    const collector = createConfigurationIndexCollector()
    const runtime = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Конфигурация.yaml",
      logicalAddress: "Конфигурация",
    })

    expect(configurationChildObjectsFromIndex(runtime)).toEqual({
      Language: ["Русский", "Английский"],
      Catalog: "Товары",
    })
    expect(collector.fragment("Конфигурация.yaml").xmlNodes).toEqual([{
      logicalAddress: "Конфигурация.Свойство.childObjects",
      order,
    }])
  })
})
