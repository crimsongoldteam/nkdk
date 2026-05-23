import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import "~/metadata/commonObjects/i8nText/fromYAML"
import { importPropertiesFromYAML, importPropertyFromYAML } from "./fromYAML"
import type { MetadataItemRule, PropertyRule } from "./types"

const defaultRule = {
  yaml: "Поле",
  type: "string",
  defaultValueYAML: "model-default",
} as const satisfies PropertyRule

const synonymRule = {
  itemType: "MetadataCatalog",
  properties: {
    name: { type: "string", yaml: "Имя" },
    synonym: {
      type: "I8nText",
      yaml: "Синоним",
      defaultValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name } }),
      applyModelDefaultValueYAMLOnImport: { whenAnyYAMLKeyPresent: ["Имя"] },
    },
  },
} as const satisfies MetadataItemRule

describe("importPropertyFromYAML", () => {
  it("does not apply defaultValueYAML to missing YAML without opt-in", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: defaultRule,
        value: undefined,
        yaml: {},
      })
    ).toBeUndefined()
  })

  it("applies model-compatible YAML default when opt-in condition matches", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: {
          ...defaultRule,
          applyModelDefaultValueYAMLOnImport: {
            whenAnyYAMLKeyPresent: ["Маркер"],
          },
        },
        value: undefined,
        yaml: { Маркер: "есть" },
      })
    ).toBe("model-default")
  })

  it("does not apply model-compatible YAML default when opt-in condition is absent", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: {
          ...defaultRule,
          applyModelDefaultValueYAMLOnImport: {
            whenAnyYAMLKeyPresent: ["Маркер"],
          },
        },
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

  it("applies default synonym when YAML omits synonym and source has no synonym", () => {
    const result = importPropertiesFromYAML({
      context: mockContext,
      metadataRule: synonymRule,
      name: "ПравилаОтправкиДокументов",
      yaml: { Имя: "ПравилаОтправкиДокументов" },
      source: { itemType: "MetadataCatalog", name: "ПравилаОтправкиДокументов" },
    })

    expect(result.synonym).toEqual({ items: { ru: "ПравилаОтправкиДокументов" } })
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
})
