import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import { getUUID, UUID_TEST } from "./uuid"
import { TEST_CONFIGURATION_UUID, testConfigurationIndexReader } from "../../tests/configurationIndex"

describe("getUUID", () => {
  it("keeps legacy test mode without export runtime", () => {
    expect(getUUID({ languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, version: "2.20", testMode: true })).toBe(UUID_TEST)
  })

  it("uses configuration index export runtime when it is present", () => {
    const collector = createConfigurationIndexCollector()
    const source = testConfigurationIndexReader([{
          logicalAddress: "Справочник.Товары",
          uuid: TEST_CONFIGURATION_UUID,
        }])
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context: ConfigurationContext = {
      languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
      version: "2.20",
      testMode: true,
      exportToXML: {

        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }

    expect(getUUID(context)).toBe(TEST_CONFIGURATION_UUID)
  })
})
