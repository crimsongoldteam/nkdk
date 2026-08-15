import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { exportChildFileItemNamesToXML } from "./toXML"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"

const rule = { type: "ChildFileItemNames" as const, xml: "Table", forReferenceOnly: true as const }

describe("exportChildFileItemNamesToXML", () => {
  it("возвращает непустой массив имён file-item объектов", () => {
    expect(exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: ["Таблица", "Куб"] })).toEqual([
      "Куб",
      "Таблица",
    ])
  })

  it("возвращает undefined при пустом массиве", () => {
    expect(exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: [] })).toBeUndefined()
  })

  it("возвращает undefined при value = undefined", () => {
    expect(exportChildFileItemNamesToXML({ context: mockContextToXML(), rule, value: undefined })).toBeUndefined()
  })

  it("восстанавливает порядок имён из снимка", () => {
    const metadataRule = {
      itemType: "ChildFileItemNamesProbe",
      properties: {
        children: {
          type: "ChildFileItemNames",
          yaml: "Дети",
          xml: "Table",
          xmlParents: ["ChildObjects"],
          forReferenceOnly: true,
        },
      },
    } as const satisfies MetadataItemRule
    const contexts = createDirectRoundTripContexts()
    testPropertyFromXMLToYAML({
      rule: metadataRule,
      context: contexts.importContext,
      xml: { ChildObjects: { Table: ["Все", "ПоУмолчанию", "Модуль"] } },
    })
    const exportContext = contexts.exportContext()
    const restored = testPropertyFromYAMLToXML({
      rule: metadataRule,
      context: exportContext,
      yaml: { Дети: ["Модуль", "Все", "ПоУмолчанию"] },
    })

    expect(restored.xml).toEqual({
      ChildObjects: { Table: ["Все", "ПоУмолчанию", "Модуль"] },
    })
    expect(
      exportContext.exportToXML.configurationIndex?.collector.fragment("Тест.yaml").entities[0]?.children
    ).toEqual([
      { xmlName: "Table", name: "Все" },
      { xmlName: "Table", name: "ПоУмолчанию" },
      { xmlName: "Table", name: "Модуль" },
    ])
  })
})
