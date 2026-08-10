import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "@nkdk/runtime"
import { sampleSnapshot, TEST_UUID } from "@nkdk/runtime"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
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
