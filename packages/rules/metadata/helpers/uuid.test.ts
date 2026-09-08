import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { getUUID, UUID_TEST } from "./uuid"
import { testConfigurationIndexReader } from "../../tests/configurationIndex"
import { exportUUIDToXML } from "../commonObjects/uuid/toXML"

describe("getUUID", () => {
  it("keeps legacy test mode without export runtime", () => {
    expect(getUUID({ languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, version: "2.20", testMode: true })).toBe(UUID_TEST)
  })

  it("uses configuration index export runtime when it is present", () => {
    const savedUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    const collector = createConfigurationIndexCollector()
    const source = testConfigurationIndexReader([{
          logicalAddress: "Справочник.Товары",
          uuid: savedUuid,
        }])
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context: ConfigurationContextWithExportToXML = {
      languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
      version: "2.20",
      testMode: true,
      exportToXML: {

        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }

    expect(getUUID(context)).toBe(savedUuid)
    const invocation = {
      context, rule: { type: "uuid" as const }, value: undefined,
      referenceMetadata: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    }
    expect(exportUUIDToXML(invocation)).toBe(savedUuid)
  })
})
