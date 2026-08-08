import { Value } from "typebox/value"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { getTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import {
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  exportUsedMobileApplicationFunctionalitiesToJSONSchema,
  exportUsedMobileApplicationFunctionalitiesToXML,
  exportUsedMobileApplicationFunctionalitiesToYAML,
  importUsedMobileApplicationFunctionalitiesFromXML,
  importUsedMobileApplicationFunctionalitiesFromYAML,
  type UsedMobileApplicationFunctionalities,
  type UsedMobileApplicationFunctionalitiesYAML,
} from "./usedMobileApplicationFunctionalities"

const schemaRule = { type: "string" } satisfies PropertyRule

const functionalities = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) =>
  item.functionality === "Camera" ? { ...item, use: true } : { ...item }
)

const xml = {
  "app:functionality": functionalities.map((item) => ({
    "app:functionality": item.functionality,
    "app:use": String(item.use) as "true" | "false",
  })),
  "app:permissionMessage": [
    {
      "app:permission": "Camera" as const,
      "app:description": { "v8:item": { "v8:lang": "ru", "v8:content": "Камера" } },
    },
    { "app:permission": "PostNotifications" as const, "app:description": "" as const },
    {
      "app:permission": "Camera" as const,
      "app:description": { "v8:item": { "v8:lang": "en", "v8:content": "Duplicate" } },
    },
  ],
}

const modelFromXML: UsedMobileApplicationFunctionalities = {
  functionalities,
  permissionMessages: [
    { permission: "Camera", description: { items: { ru: "Камера" } } },
    { permission: "PostNotifications", description: { items: {} } },
    { permission: "Camera", description: { items: { en: "Duplicate" } } },
  ],
}

const yaml: UsedMobileApplicationFunctionalitiesYAML = {
  Функциональности: [{ Функциональность: "Камера", Использовать: "Истина" }],
  СообщенияРазрешений: [
    { Разрешение: "Камера", Описание: "Камера" },
    { Разрешение: "PostNotifications", Описание: "" },
    { Разрешение: "Камера", Описание: { en: "Duplicate" } },
  ],
}

describe("UsedMobileApplicationFunctionalities", () => {
  it("imports and exports XML in schema order without losing messages", () => {
    expect(importUsedMobileApplicationFunctionalitiesFromXML(mockContext, undefined, xml)).toEqual(modelFromXML)

    const exported = exportUsedMobileApplicationFunctionalitiesToXML(mockContext, undefined, modelFromXML)
    expect(Object.keys(exported as object)).toEqual(["app:functionality", "app:permissionMessage"])
    expect((exported as { "app:functionality": unknown[] })["app:functionality"]).toHaveLength(38)
    expect((exported as { "app:permissionMessage": unknown[] })["app:permissionMessage"]).toEqual([
      {
        "app:permission": "Camera",
        "app:description": { "v8:item": [{ "v8:lang": "ru", "v8:content": "Камера" }] },
      },
      { "app:permission": "PostNotifications", "app:description": {} },
      {
        "app:permission": "Camera",
        "app:description": { "v8:item": [{ "v8:lang": "en", "v8:content": "Duplicate" }] },
      },
    ])
  })

  it("uses an object YAML contract with compact functionalities", () => {
    const imported = importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, yaml)
    expect(imported).toEqual({
      functionalities,
      permissionMessages: [
        modelFromXML.permissionMessages[0],
        { permission: "PostNotifications", description: { items: { ru: "" } } },
        modelFromXML.permissionMessages[2],
      ],
    })
    expect(exportUsedMobileApplicationFunctionalitiesToYAML(mockContext, undefined, imported)).toEqual(yaml)
  })

  it("normalizes missing nested fields to their implicit values", () => {
    expect(importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, undefined)).toBe(
      IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    )
    expect(importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, {})).toEqual(
      IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    )
    expect(
      importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, {
        СообщенияРазрешений: [{ Разрешение: "PostNotifications", Описание: {} }],
      })
    ).toEqual({
      functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
      permissionMessages: [{ permission: "PostNotifications", description: { items: {} } }],
    })
    expect(
      importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, {
        Функциональности: [{ Функциональность: "Камера", Использовать: "Истина" }],
      })
    ).toEqual({ functionalities, permissionMessages: [] })
  })

  it("keeps clean and empty root values distinct", () => {
    expect(exportUsedMobileApplicationFunctionalitiesToYAML(
      mockContext,
      undefined,
      IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    )).toBeUndefined()

    const cleanXML = exportUsedMobileApplicationFunctionalitiesToXML(
      mockContext,
      undefined,
      IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    )
    expect((cleanXML as { "app:functionality": unknown[] })["app:functionality"]).toHaveLength(38)
    expect(cleanXML).not.toHaveProperty("app:permissionMessage")

    const empty = { functionalities: [], permissionMessages: [] }
    expect(importUsedMobileApplicationFunctionalitiesFromXML(mockContext, undefined, "")).toEqual(empty)
    expect(exportUsedMobileApplicationFunctionalitiesToXML(mockContext, undefined, empty)).toBe("")
  })

  it("exports a strict object JSON Schema and rejects the old array", () => {
    const schema = exportUsedMobileApplicationFunctionalitiesToJSONSchema({
      context: mockContext,
      rule: schemaRule,
      value: undefined,
    })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("UsedMobileApplicationFunctionalities schema is required")

    expect(Value.Check(schema, yaml)).toBe(true)
    expect(Value.Check(schema, [{ Функциональность: "Камера", Использовать: "Истина" }])).toBe(false)
    expect(Value.Check(schema, { СообщенияРазрешений: [{ Разрешение: "Камера" }] })).toBe(false)
    expect(Value.Check(schema, { СообщенияРазрешений: [{ Разрешение: "Неизвестно", Описание: "" }] })).toBe(
      false
    )
  })

  it("registers all atomic type handlers", () => {
    expect(getTypeRule("UsedMobileApplicationFunctionalities", "importFromXML")).toBe(
      importUsedMobileApplicationFunctionalitiesFromXML
    )
    expect(getTypeRule("UsedMobileApplicationFunctionalities", "exportToXML")).toBe(
      exportUsedMobileApplicationFunctionalitiesToXML
    )
    expect(getTypeRule("UsedMobileApplicationFunctionalities", "importFromYAML")).toBe(
      importUsedMobileApplicationFunctionalitiesFromYAML
    )
    expect(getTypeRule("UsedMobileApplicationFunctionalities", "exportToYAML")).toBe(
      exportUsedMobileApplicationFunctionalitiesToYAML
    )
    expect(getTypeRule("UsedMobileApplicationFunctionalities", "exportToJSONSchema")).toBe(
      exportUsedMobileApplicationFunctionalitiesToJSONSchema
    )
  })
})
