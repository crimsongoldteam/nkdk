import { describe, expect, it } from "vitest"

import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { testAppliedObjectFromXMLToYAML, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { PredefinedRules } from "./rules"

import "./types"

describe("Predefined XML → YAML", () => {
  it("imports full.xml", () => {
    const result = convertFull().yaml
    expect(result).toHaveProperty("Группа.ЭтоГруппа", "Истина")
    expect(result).toHaveProperty("Группа.Элементы.Предопределенный1")
  })

  it("пишет id предопределенных элементов в адреса конкретных элементов индекса", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      collector,
      "Справочник.Товары"
    )
    const parsed = readAndParseXMLFixture<Record<string, unknown>>(import.meta.url, "full.xml")

    testMetadataItemFromXMLToYAML({ context, rule: PredefinedRules, xml: parsed })

    expect(collector.fragment("Справочники/Товары/Свойства.yaml").identities).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "Справочник.Товары.Предопределенный.Группа",
          kind: "xmlId",
          value: "79d5668f-62a2-4d95-954b-8d3b03b76b99",
        },
        {
          logicalAddress: "Справочник.Товары.Предопределенный.Группа.Предопределенный.Предопределенный1",
          kind: "xmlId",
          value: "3234ebff-0d7f-4ad7-b6c4-1f86a23725dd",
        },
      ])
    )
  })

  it("экспортирует items как корневой Record (без обёртки items:)", () => {
    const result = convertFull().yaml
    expect(result).not.toHaveProperty("items")
    expect(result).toHaveProperty("Группа")
  })
})

const convertFull = () =>
  testAppliedObjectFromXMLToYAML({
    rule: PredefinedRules,
    importMetaUrl: import.meta.url,
    fixture: "full.xml",
  })
