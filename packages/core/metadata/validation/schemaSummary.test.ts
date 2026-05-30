import { describe, expect, it } from "vitest"

import { listSchemaSummaryKeys, summarizeJSONSchema } from "./schemaSummary"

const exampleSchema = {
  type: "object",
  required: ["Вид"],
  properties: {
    Вид: {
      const: "ПолеВвода",
      description: "Вид элемента формы.",
      examples: [],
    },
    ПутьКДанным: {
      type: "string",
      description: "Путь к реквизиту формы.",
      pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
    },
    Видимость: {
      type: "boolean",
      description: null,
      examples: [],
    },
  },
} satisfies Record<string, unknown>

describe("schema summary", () => {
  it("normalizes object properties into fields and removes empty values", () => {
    expect(summarizeJSONSchema(exampleSchema)).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ПолеВвода",
          description: "Вид элемента формы.",
        },
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
        {
          key: "Видимость",
          required: false,
          type: ["boolean"],
        },
      ],
    })
  })

  it("returns plain keys", () => {
    expect(listSchemaSummaryKeys(exampleSchema)).toEqual(["Вид", "ПутьКДанным", "Видимость"])
  })

  it("filters keys by terms split with pipe", () => {
    expect(listSchemaSummaryKeys(exampleSchema, { keyTerms: "путь|видим" })).toEqual(["ПутьКДанным", "Видимость"])
  })

  it("returns only required fields", () => {
    expect(summarizeJSONSchema(exampleSchema, { requiredOnly: true })).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ПолеВвода",
          description: "Вид элемента формы.",
        },
      ],
    })
  })

  it("searches fields by key and textual schema values", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "путь|boolean" })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
        {
          key: "Видимость",
          required: false,
          type: ["boolean"],
        },
      ],
    })
  })

  it("searches exact top-level field names", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "ПутьКДанным", exact: true })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к реквизиту формы.",
          pattern: "^[А-Яа-яA-Za-z0-9_.]+$",
        },
      ],
    })
  })

  it("returns empty values when nothing matches", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "НесуществующееПоле" })).toBeUndefined()
    expect(listSchemaSummaryKeys(exampleSchema, { search: "НесуществующееПоле" })).toEqual([])
  })

  it("collects object properties from anyOf branches", () => {
    const branchedSchema = {
      anyOf: [
        {
          type: "object",
          required: ["Вид"],
          properties: {
            Вид: { const: "ОбычнаяГруппа" },
          },
        },
        {
          type: "object",
          properties: {
            Элементы: {
              type: "array",
              items: { $ref: "#/$defs/FormElement" },
            },
          },
        },
      ],
    }

    expect(summarizeJSONSchema(branchedSchema)).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          const: "ОбычнаяГруппа",
        },
        {
          key: "Элементы",
          required: false,
          type: ["array"],
          items: { $ref: "#/$defs/FormElement" },
        },
      ],
    })
  })
})
