import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { fixtureUserSettingsIDRefFull } from "./__fixtures__/data"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { importPropertiesFromXML } from "../../orchestration/property/fromXML"

const rule: PropertyRule = {
  type: "UserSettingsID",
}

const xmlRootTag = "dcsset:userSettingID"

describe("importUserSettingsIDFromXML", () => {
  it("imports full.xml when not for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fixtureUserSettingsIDRefFull)
  })

  it("imports empty.xml when not for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "empty.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
    })

    expect(result).toBeUndefined()
  })

  it("imports full.xml for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    expect(result).toEqual(fixtureUserSettingsIDRefFull)
  })

  it("imports empty.xml for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "empty.xml",
      xmlRootTag,
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    expect(result).toBeUndefined()
  })

  it("хранит исходный идентификатор настройки в модели и не дублирует его в индексе", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      {
        defaultLanguage: "ru",
        version: "2.20",
        fromXML: { forReference: false },
      },
      collector,
      "Отчёт.Продажи"
    )

    const model = importPropertiesFromXML({
      context,
      rule: {
        itemType: "Report",
        properties: {
          userSettingsId: { type: "UserSettingsID", xml: "UserSettingsID" },
        },
      } as any,
      xml: { UserSettingsID: "Настройка-1" },
    })

    expect(model).toEqual({ userSettingsId: "Настройка-1" })
    expect(collector.fragment("Отчёт/Продажи/Свойства.yaml").xmlValues).toEqual([])
  })
})
