import { describe, expect, it } from "vitest"
import { multiple, multipleYAML, single, singleYAML } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importMetadataObjectRefCollectionFromYAML } from "./fromYAML"
import { callAtomicFromYAML } from "../../ruleRuntime"
import { createPropertyRuleExecutor, createPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"

describe("importMetadataObjectRefCollectionFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("сохраняет отсутствие значения для пустой коллекции в общем пути rules", () => {
    const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))
    expect(callAtomicFromYAML({
      context: mockContext,
      rule: {
        type: "MetadataObjectRefCollection",
        yaml: "Владельцы",
        metadataTarget: { kind: "object", roots: ["Catalog"] },
      },
      value: [],
      execution,
    })).toBeUndefined()
  })

  it("should import with single value", () => {
    const result = importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, singleYAML)

    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const result = importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, multipleYAML)

    expect(result).toEqual(multiple)
  })

  it("imports russian object references", () => {
    const result = importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, [
      "Справочник.Контрагенты",
      "Документ.ЗаказПокупателя",
    ])

    expect(result).toEqual(["Catalog.Контрагенты", "Document.ЗаказПокупателя"])
  })

  it("rejects english YAML roots", () => {
    expect(() => importMetadataObjectRefCollectionFromYAML(mockContext, mockRule, ["Catalog.Контрагенты"])).toThrow(
      'Неизвестный корень "Catalog"'
    )
  })

  it("honors metadataTarget roots", () => {
    const rule = {
      type: "MetadataObjectRefCollection",
      metadataTarget: { kind: "object", roots: ["Catalog", "Document"] },
    } as const

    expect(
      importMetadataObjectRefCollectionFromYAML(mockContext, rule, [
        "Справочник.Контрагенты",
        "Документ.ЗаказПокупателя",
      ])
    ).toEqual(["Catalog.Контрагенты", "Document.ЗаказПокупателя"])

    expect(() => importMetadataObjectRefCollectionFromYAML(mockContext, rule, ["Перечисление.Статусы"])).toThrow(
      'Корень "Enum" не разрешён для цели метаданных'
    )
  })
})
