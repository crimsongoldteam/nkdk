import { describe, expect, it } from "vitest"

import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import type { MetadataItemRule } from "../../orchestration"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { fixtureUserSettingsIDRefFull } from "./__fixtures__/data"

import "./fromXML"
import "./toYAML"

const rule = {
  itemType: "Report",
  properties: {
    userSettingsId: { type: "UserSettingsID", xml: "UserSettingsID", yaml: "ИдентификаторНастройки" },
  },
} as MetadataItemRule

const readValue = (fixture: "full.xml" | "empty.xml") =>
  readAndParseXMLFixture<Record<string, unknown>>(import.meta.url, fixture)["dcsset:userSettingID"]

const convert = (fixture: "full.xml" | "empty.xml", forReference: boolean) =>
  testPropertyFromXMLToYAML({
    rule,
    xml: { UserSettingsID: readValue(fixture) },
    context: mockContextFromXML({ forReference }),
  }).yaml

describe("UserSettingsID XML → YAML", () => {
  it("imports full.xml when not for reference", () => {
    expect(convert("full.xml", false)).toEqual({ ИдентификаторНастройки: fixtureUserSettingsIDRefFull })
  })

  it("imports empty.xml when not for reference", () => {
    expect(convert("empty.xml", false)).toEqual({})
  })

  it("imports full.xml for reference", () => {
    expect(convert("full.xml", true)).toEqual({ ИдентификаторНастройки: fixtureUserSettingsIDRefFull })
  })

  it("imports empty.xml for reference", () => {
    expect(convert("empty.xml", true)).toEqual({})
  })

  it("хранит исходный идентификатор настройки в YAML и не дублирует его в индексе", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Отчёт.Продажи")

    const result = testPropertyFromXMLToYAML({
      context,
      rule,
      xml: { UserSettingsID: "Настройка-1" },
    })

    expect(result.yaml).toEqual({ ИдентификаторНастройки: "Настройка-1" })
    expect(indexCollector.fragment("Отчёт/Продажи/Свойства.yaml").xmlValues).toEqual([])
  })
})
