import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { exportBorrowedPropertyStateSchema } from "./propertyStateSchema"

const rule = {
  itemType: "MetadataCatalog",
  properties: {
    synonym: { type: "string", yaml: "Синоним" },
    codeLength: { type: "number", yaml: "ДлинаКода" },
    comment: { type: "string", yaml: "Комментарий" },
    objectModule: { type: "ExternalFile", yaml: "МодульОбъекта" },
  },
} as MetadataItemRule

const capability: ResolvedPropertyStateItemCapability = {
  itemType: "MetadataCatalog",
  properties: {
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
        Синоним: Type.Optional(Type.String()),
        ДлинаКода: Type.Optional(Type.Number()),
        Комментарий: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
    }) as { properties: Record<string, unknown>; additionalProperties: boolean }

    expect(Object.keys(schema.properties)).toEqual(["Синоним", "ДлинаКода", "Изменять"])
    expect(schema.properties).not.toHaveProperty("Комментарий")
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
})
