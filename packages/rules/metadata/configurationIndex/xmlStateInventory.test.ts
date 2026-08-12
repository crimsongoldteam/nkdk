import { createConfigurationIndexCollector, withConfigurationIndexCollector } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { registerTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { PropertyRuleType } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../ruleRuntime/property/fromXMLToYAML"
import { mockContextFromXML } from "../../tests/mockContext"

import "../../tests/directConversion"

function expectNoOrdinaryXMLState(index: Pick<ConfigurationSnapshot, "entities">): void {
  for (const entity of index.entities) {
    expect(entity.identities?.xmlName).toBeUndefined()
    expect(entity.xml?.present).toBeUndefined()
    expect(entity.xml?.xsiNil).toBeUndefined()
    expect(entity.xml?.explicitEmpty).toBeUndefined()
    expect(entity.xml?.xsiType).toBeUndefined()
    expect(entity.xml?.xmlText).toBeUndefined()
    expect(entity.xml?.xmlPrefix).toBeUndefined()
  }
}

describe("тонкое содержимое снимка конфигурации", () => {
  it("сохраняет идентификаторы, но не обычное XML-состояние", () => {
    registerTypeRule("TestInventoryEmptyCollection" as PropertyRuleType, "importFromXMLToYAML", ({ xml }) => {
      if (!Array.isArray(xml) || xml.length !== 0) throw new Error("Ожидалась пустая XML-коллекция")
      return ["преобразована"]
    })
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML(),
      collector,
      "Документ.Заказ",
    )
    const rule = {
      itemType: "Document",
      properties: {
        uuid: { type: "string", xml: "_uuid", forReferenceOnly: true },
        id: { type: "string", xml: "_id", forReferenceOnly: true },
        name: { type: "string", xml: "_name" },
        comment: {
          type: "string",
          xml: "Comment",
          yaml: "Комментарий",
          defaultValueXMLEmpty: "",
        },
        fillValue: { type: "MetadataValue", xml: "FillValue", yaml: "ЗначениеЗаполнения" },
        emptyCollection: {
          type: "TestInventoryEmptyCollection",
          xml: "EmptyCollection",
          yaml: "ПустаяКоллекция",
        },
        nilValue: { type: "MetadataValue", xml: "NilValue", yaml: "ПустоеЗначение" },
        typedValue: { type: "MetadataValue", xml: "TypedValue", yaml: "ТипизированноеЗначение" },
        length: {
          type: "number",
          xml: "Length",
          yaml: "Длина",
          defaultValueXML: 25,
          implicitValueYAML: 30,
          omitNonImplicitReferenceXMLWhenYAMLMissing: true,
        },
      },
    } as const satisfies MetadataItemRule

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule,
      sources: [{
        context,
        xml: {
          _uuid: "00000000-0000-4000-8000-000000000001",
          _id: "Document42",
          _name: "СтароеИмяЗаказа",
          Comment: "",
          FillValue: { "_xsi:type": "xs:string" },
          NilValue: { "_xsi:nil": true },
          TypedValue: { "_xsi:type": "v8:Null" },
          EmptyCollection: [],
          Length: 30,
        },
      }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toMatchObject({ ПустаяКоллекция: ["преобразована"] })
    const entities = collector.fragment("Документы/Заказ.yaml").entities
    expect(entities).toContainEqual(expect.objectContaining({
      logicalAddress: "Документ.Заказ",
      identities: expect.objectContaining({
        uuid: "00000000-0000-4000-8000-000000000001",
        xmlId: "Document42",
      }),
    }))
    expectNoOrdinaryXMLState({ entities })
  })
})
