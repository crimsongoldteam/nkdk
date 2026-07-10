import { compileValidationSchema } from "./../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { FormattedI8nTextJSONSchema } from "../commonObjects/formattedI8nText/types"
import { I8nTextJSONSchema } from "../commonObjects/i8nText/types"
import {
  EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION,
  applyExcludedEqualNameYAMLToJSONSchema,
  findExcludedEqualNameYAMLOccurrence,
} from "./excludeIfEqualNameYAML"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("findExcludedEqualNameYAMLOccurrence", () => {
  it("detects a default-language I8nText string equal to the item name", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: "Какое то поле",
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toEqual({ path: ["Синоним"], value: "Какое то поле" })
  })

  it("detects only the default language in multilingual I8nText", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: { ru: "Какое то поле", en: "Some field" },
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toEqual({ path: ["Синоним", "ru"], value: "Какое то поле" })

    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        value: { en: "Какое то поле" },
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toBeUndefined()
  })

  it("detects a default-language FormattedI8nText text equal to the item name", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
        value: {
          Форматированный: "Истина",
          Текст: { ru: "Какое то поле", en: "Some field" },
        },
        name: "КакоеТоПоле",
        path: ["Заголовок"],
      })
    ).toEqual({ path: ["Заголовок", "Текст", "ru"], value: "Какое то поле" })
  })

  it("ignores rules without excludeIfEqualNameYAML", () => {
    expect(
      findExcludedEqualNameYAMLOccurrence({
        context,
        rule: { type: "I8nText", yaml: "Синоним" },
        value: "Какое то поле",
        name: "КакоеТоПоле",
        path: ["Синоним"],
      })
    ).toBeUndefined()
  })
})

describe("applyExcludedEqualNameYAMLToJSONSchema", () => {
  it("adds a universal description to I8nText rules without rejecting concrete values", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
      schema: I8nTextJSONSchema,
    })

    expect((schema as { description?: string }).description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)

    const compiled = compileValidationSchema(schema)
    expect(compiled.Check("Какое то поле")).toBe(true)
    expect(compiled.Check({ ru: "Какое то поле", en: "Some field" })).toBe(true)
    expect(compiled.Check({ en: "Some field" })).toBe(true)
  })

  it("adds a universal description to FormattedI8nText rules without rejecting concrete values", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      schema: FormattedI8nTextJSONSchema,
    })

    expect((schema as { description?: string }).description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)

    const compiled = compileValidationSchema(schema)
    expect(compiled.Check({ Текст: "Какое то поле" })).toBe(true)
    expect(compiled.Check({ Текст: { ru: "Какое то поле", en: "Some field" } })).toBe(true)
    expect(compiled.Check({ Форматированный: "Истина", Текст: { en: "Some field" } })).toBe(true)
  })

  it("keeps schemas without excludeIfEqualNameYAML unchanged", () => {
    const schema = applyExcludedEqualNameYAMLToJSONSchema({
      rule: { type: "I8nText", yaml: "Синоним" },
      schema: I8nTextJSONSchema,
    })

    expect(schema).toBe(I8nTextJSONSchema)
  })
})
