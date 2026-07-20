import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { PredefinedRules } from "./rules"

// Активируем регистрацию правила
import "./types"

describe("import Predefined from XML", () => {
  it("imports full.xml", () => {
    const xmlString = readXMLFixtureAsString(import.meta.url, "full.xml")
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString,
    })
    expect(result).toMatchObject({
      itemType: "Predefined",
      items: expect.any(Array),
    })
    expect(result?.items?.length ?? 0).toBeGreaterThan(0)
    // Корневой Item с дочерним
    const group = result!.items!.find((it: any) => it.name === "Группа")
    expect(group).toMatchObject({
      isFolder: true,
      childItems: expect.any(Array),
    })
    expect(group!.childItems![0]).toMatchObject({ name: "Предопределенный1", isFolder: false })
  })

  it("пишет id предопределенных элементов в адреса конкретных элементов индекса", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      collector,
      "Справочник.Товары"
    )
    const parsed = readAndParseXMLFixture<{ PredefinedData: unknown }>(import.meta.url, "full.xml")

    importMetadataItemFromXML({
      context,
      rule: PredefinedRules,
      xml: parsed.PredefinedData,
    })

    const identities = collector.fragment("Справочники/Товары/Свойства.yaml").identities
    expect(identities).toEqual(
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
})
