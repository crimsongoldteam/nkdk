import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import "~/metadata/commonObjects/i8nText/fromYAML"
import { importPropertiesFromYAML, importPropertyFromYAML } from "./fromYAML"
import type { MetadataItemRule, PropertyRule } from "./types"

const defaultRule = {
  yaml: "Поле",
  type: "string",
  implicitValueYAML: "model-default",
} as const satisfies PropertyRule

const synonymRule = {
  itemType: "MetadataCatalog",
  properties: {
    name: { type: "string", yaml: "Имя" },
    synonym: {
      type: "I8nText",
      yaml: "Синоним",
      implicitValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name } }),
    },
  },
} as const satisfies MetadataItemRule

describe("importPropertyFromYAML", () => {
  it("does not apply implicitValueYAML to missing YAML", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: defaultRule,
        value: undefined,
        yaml: {},
      })
    ).toBeUndefined()
  })
})

describe("importPropertiesFromYAML", () => {
  it("preserves explicit empty synonym from source when YAML omits synonym", () => {
    const result = importPropertiesFromYAML({
      context: mockContext,
      metadataRule: synonymRule,
      name: "ПравилаОтправкиДокументов",
      yaml: { Имя: "ПравилаОтправкиДокументов" },
      source: {
        itemType: "MetadataCatalog",
        name: "ПравилаОтправкиДокументов",
        synonym: { items: {} },
      },
    })

    expect(result.synonym).toEqual({ items: {} })
  })

  it("does not apply default synonym when YAML omits synonym and source has no synonym", () => {
    const result = importPropertiesFromYAML({
      context: mockContext,
      metadataRule: synonymRule,
      name: "ПравилаОтправкиДокументов",
      yaml: { Имя: "ПравилаОтправкиДокументов" },
      source: { itemType: "MetadataCatalog", name: "ПравилаОтправкиДокументов" },
    })

    expect(result.synonym).toBeUndefined()
  })

  it("uses explicit YAML synonym over empty synonym from source", () => {
    const result = importPropertiesFromYAML({
      context: mockContext,
      metadataRule: synonymRule,
      name: "ПравилаОтправкиДокументов",
      yaml: {
        Имя: "ПравилаОтправкиДокументов",
        Синоним: "Явный синоним",
      },
      source: {
        itemType: "MetadataCatalog",
        name: "ПравилаОтправкиДокументов",
        synonym: { items: {} },
      },
    })

    expect(result.synonym).toEqual({ items: { ru: "Явный синоним" } })
  })

  it("rejects scalar YAML for metadata items without yamlInline", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: {
          itemType: "MetadataAttribute",
          properties: {
            type: { yaml: "Тип", type: "TypeDescription", required: true },
          },
        },
        name: "Организация",
        yaml: "Справочник.Организации" as never,
      })
    ).toThrow("MetadataAttribute: ожидался YAML-объект")
  })
})
