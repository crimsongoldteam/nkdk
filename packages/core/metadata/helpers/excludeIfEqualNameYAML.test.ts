import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { FormattedI8nTextJSONSchema } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextJSONSchema } from "~/metadata/commonObjects/i8nText/types"
import {
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
  it("rejects equal I8nText string and default-language map values", () => {
    const schema = TypeCompiler.Compile(
      applyExcludedEqualNameYAMLToJSONSchema({
        context,
        rule: { type: "I8nText", yaml: "Синоним", excludeIfEqualNameYAML: true },
        schema: I8nTextJSONSchema,
        name: "КакоеТоПоле",
      })
    )

    expect(schema.Check("Какое то поле")).toBe(false)
    expect(schema.Check({ ru: "Какое то поле", en: "Some field" })).toBe(false)
    expect(schema.Check({ en: "Some field" })).toBe(true)
    expect(schema.Check("Другое поле")).toBe(true)
  })

  it("rejects equal FormattedI8nText default-language text values", () => {
    const schema = TypeCompiler.Compile(
      applyExcludedEqualNameYAMLToJSONSchema({
        context,
        rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
        schema: FormattedI8nTextJSONSchema,
        name: "КакоеТоПоле",
      })
    )

    expect(schema.Check({ Текст: "Какое то поле" })).toBe(false)
    expect(schema.Check({ Текст: { ru: "Какое то поле", en: "Some field" } })).toBe(false)
    expect(schema.Check({ Форматированный: "Истина", Текст: { en: "Some field" } })).toBe(true)
    expect(schema.Check({ Текст: "Другое поле" })).toBe(true)
  })
})
