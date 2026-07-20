import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import type { ConfigurationContext } from "../context/types"
import { getUUID, UUID_TEST } from "./uuid"

describe("getUUID", () => {
  it("keeps legacy test mode without export runtime", () => {
    expect(getUUID({ defaultLanguage: "ru", version: "2.20", testMode: true })).toBe(UUID_TEST)
  })

  it("uses configuration index export runtime when it is present", () => {
    const collector = createConfigurationIndexCollector()
    const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex())))
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context: ConfigurationContext = {
      defaultLanguage: "ru",
      version: "2.20",
      testMode: true,
      exportToXML: {
        configDumpInfo: new Map(),
        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }

    expect(getUUID(context)).toBe("00000000-0000-4000-8000-000000000001")
  })
})
