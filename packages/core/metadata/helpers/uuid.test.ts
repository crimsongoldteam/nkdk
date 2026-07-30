import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleSnapshot, TEST_UUID } from "../configurationIndex/testData"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import type { ConfigurationContext } from "../context/types"
import { getUUID, UUID_TEST } from "./uuid"

describe("getUUID", () => {
  it("keeps legacy test mode without export runtime", () => {
    expect(getUUID({ defaultLanguage: "ru", version: "2.20", testMode: true })).toBe(UUID_TEST)
  })

  it("uses configuration index export runtime when it is present", () => {
    const collector = createConfigurationIndexCollector()
    const snapshot = sampleSnapshot()
    const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex({
      ...snapshot,
      entities: [
        ...snapshot.entities,
        {
          logicalAddress: "Справочник.Товары",
          sourceProjectPath: "Configuration.yaml",
          identities: { uuid: TEST_UUID },
        },
      ],
    })))
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

        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }

    expect(getUUID(context)).toBe(TEST_UUID)
  })
})
