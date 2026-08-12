import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { exportBorrowedPropertyStateSchema } from "../../ruleRuntime/property/propertyStateSchema"
import { exportNestedPropertyStateSchema } from "../../ruleRuntime/property/propertyStateSchema"

const rule = {
  itemType: "MetadataCatalog",
  properties: {
    name: { type: "string", yaml: "Имя" },
    comment: { type: "string", yaml: "Комментарий" },
    synonym: { type: "string", yaml: "Синоним" },
    codeLength: { type: "number", yaml: "ДлинаКода" },
    objectModule: { type: "ExternalFile", yaml: "МодульОбъекта" },
    attributes: { type: "Attributes", yaml: "Реквизиты" },
  },
} as MetadataItemRule

const capability: ResolvedPropertyStateItemCapability = {
  itemType: "MetadataCatalog",
  properties: {
    name: { availability: "own", modes: [] },
    comment: { availability: "own", modes: [] },
    synonym: { availability: "borrowed", modes: ["extend"], representation: "plain" },
    codeLength: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
    objectModule: {
      availability: "borrowed",
      modes: ["extend"],
      representation: "section",
      externalName: "МодульОбъекта",
    },
  },
}

describe("borrowed property-state schema", () => {
  it("keeps only capabilities and adds closed canonical sections", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({
        Имя: Type.String(),
        Комментарий: Type.Optional(Type.String()),
        Синоним: Type.Optional(Type.String()),
        ДлинаКода: Type.Optional(Type.Number()),
        Реквизиты: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }, { additionalProperties: false }),
      structuralPropertyKeys: ["attributes"],
    }) as { properties: Record<string, unknown>; additionalProperties: boolean }

    expect(Object.keys(schema.properties)).toEqual([
      "Имя",
      "Комментарий",
      "Синоним",
      "ДлинаКода",
      "Реквизиты",
      "Изменять",
    ])
    expect(schema.properties.Изменять).toMatchObject({
      type: "array",
      items: { enum: ["МодульОбъекта"] },
      uniqueItems: true,
    })
    expect(schema.properties).not.toHaveProperty("Проверять")
    expect(schema.additionalProperties).toBe(false)
  })

  it("adds both sections only with names allowed for each mode", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability: {
        ...capability,
        properties: {
          ...capability.properties,
          objectModule: {
            ...capability.properties.objectModule!,
            modes: ["control", "notify", "extend"],
          },
        },
      },
      source: Type.Object({}, { additionalProperties: false }),
    }) as { properties: Record<string, { items?: { enum?: string[] } }> }

    expect(schema.properties.Проверять?.items?.enum).toEqual(["МодульОбъекта"])
    expect(schema.properties.Изменять?.items?.enum).toEqual(["МодульОбъекта"])
  })

  it("разрешает пустое значение локального тега для многорежимного скаляра", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({ ДлинаКода: Type.Optional(Type.Number()) }, { additionalProperties: false }),
    }) as { properties: Record<string, { anyOf?: unknown[] }> }

    expect(schema.properties.ДлинаКода?.anyOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "number" }),
      expect.objectContaining({ type: "object", maxProperties: 0 }),
    ]))
  })

  it("сохраняет остальные поля корня расширения, но расширяет схему локального тега", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({
        ДлинаКода: Type.Optional(Type.Number()),
        СобственноеПоле: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
      closed: false,
    }) as { properties: Record<string, { anyOf?: unknown[] }> }

    expect(schema.properties).toHaveProperty("СобственноеПоле")
    expect(schema.properties.ДлинаКода?.anyOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "object", maxProperties: 0 }),
    ]))
  })

  it("различает собственный и заимствованный вложенный объект по явному признаку", () => {
    const nestedRule = {
      ...rule,
      properties: {
        ...rule.properties,
        extendedConfigurationObject: {
          type: "string",
          yaml: "ОбъектРасширяемойКонфигурации",
        },
      },
    } as MetadataItemRule
    const nestedCapability: ResolvedPropertyStateItemCapability = {
      ...capability,
      properties: {
        ...capability.properties,
        extendedConfigurationObject: {
          availability: "borrowed",
          modes: ["control", "notify"],
          representation: "tagged",
        },
      },
    }
    const schema = exportNestedPropertyStateSchema({
      rule: nestedRule,
      capability: nestedCapability,
      source: Type.Object({
        Имя: Type.Optional(Type.String()),
        ДлинаКода: Type.Optional(Type.Number()),
        СобственноеПоле: Type.Optional(Type.String()),
        ОбъектРасширяемойКонфигурации: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
    }) as { anyOf?: Array<{ required?: string[]; not?: { required?: string[] } }> }

    expect(schema.anyOf).toEqual([
      expect.objectContaining({ not: { required: ["ОбъектРасширяемойКонфигурации"] } }),
      expect.objectContaining({ required: expect.arrayContaining(["ОбъектРасширяемойКонфигурации"]) }),
    ])
  })
})
