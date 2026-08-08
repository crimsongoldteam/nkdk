import { Value } from "typebox/value"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { getTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import {
  EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS,
  exportRequiredMobileApplicationPermissionsToJSONSchema,
  exportRequiredMobileApplicationPermissionsToXML,
  exportRequiredMobileApplicationPermissionsToYAML,
  importRequiredMobileApplicationPermissionsFromXML,
  importRequiredMobileApplicationPermissionsFromYAML,
  type RequiredMobileApplicationPermissionCollection,
  type RequiredMobileApplicationPermissionCollectionYAML,
} from "./requiredMobileApplicationPermissions"

const schemaRule = { type: "string" } satisfies PropertyRule

const xml = {
  "app:permission": [
    {
      "app:permission": "Camera" as const,
      "app:use": "true" as const,
      "app:description": { "v8:item": { "v8:lang": "ru", "v8:content": "Камера" } },
    },
    {
      "app:permission": "PostNotifications" as const,
      "app:use": "false" as const,
      "app:description": "" as const,
    },
    {
      "app:permission": "Camera" as const,
      "app:use": true,
      "app:description": {
        "v8:item": [
          { "v8:lang": "ru", "v8:content": "Повтор" },
          { "v8:lang": "en", "v8:content": "Duplicate" },
        ],
      },
    },
  ],
}

const modelFromXML: RequiredMobileApplicationPermissionCollection = [
  { permission: "Camera", use: true, description: { items: { ru: "Камера" } } },
  { permission: "PostNotifications", use: false, description: { items: {} } },
  { permission: "Camera", use: true, description: { items: { ru: "Повтор", en: "Duplicate" } } },
]

const modelFromYAML: RequiredMobileApplicationPermissionCollection = [
  modelFromXML[0],
  { permission: "PostNotifications", use: false, description: { items: { ru: "" } } },
  modelFromXML[2],
]

const yaml: RequiredMobileApplicationPermissionCollectionYAML = [
  { Разрешение: "Камера", Использовать: "Истина", Описание: "Камера" },
  { Разрешение: "PostNotifications", Использовать: "Ложь", Описание: "" },
  { Разрешение: "Камера", Использовать: "Истина", Описание: { ru: "Повтор", en: "Duplicate" } },
]

describe("RequiredMobileApplicationPermissions", () => {
  it("imports and exports XML without losing order, duplicates or empty descriptions", () => {
    expect(importRequiredMobileApplicationPermissionsFromXML(mockContext, undefined, xml)).toEqual(modelFromXML)
    expect(exportRequiredMobileApplicationPermissionsToXML(mockContext, undefined, modelFromXML)).toEqual({
      "app:permission": [
        {
          "app:permission": "Camera",
          "app:use": true,
          "app:description": {
            "v8:item": [{ "v8:lang": "ru", "v8:content": "Камера" }],
          },
        },
        { "app:permission": "PostNotifications", "app:use": false, "app:description": {} },
        {
          "app:permission": "Camera",
          "app:use": true,
          "app:description": xml["app:permission"][2]["app:description"],
        },
      ],
    })
  })

  it("imports and exports YAML with translated booleans and I8nText", () => {
    expect(importRequiredMobileApplicationPermissionsFromYAML(mockContext, undefined, yaml)).toEqual(modelFromYAML)
    expect(exportRequiredMobileApplicationPermissionsToYAML(mockContext, undefined, modelFromYAML)).toEqual(yaml)
    expect(
      importRequiredMobileApplicationPermissionsFromYAML(mockContext, undefined, [
        { Разрешение: "Камера", Использовать: "Истина", Описание: {} },
      ])
    ).toEqual([{ permission: "Camera", use: true, description: { items: {} } }])
  })

  it("uses one canonical empty collection for an empty XML tag", () => {
    expect(importRequiredMobileApplicationPermissionsFromXML(mockContext, undefined, "")).toBe(
      EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS
    )
    expect(exportRequiredMobileApplicationPermissionsToXML(mockContext, undefined, [])).toBe("")
  })

  it("exports a strict JSON Schema", () => {
    const schema = exportRequiredMobileApplicationPermissionsToJSONSchema({
      context: mockContext,
      rule: schemaRule,
      value: undefined,
    })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("RequiredMobileApplicationPermissions schema is required")

    expect(Value.Check(schema, yaml)).toBe(true)
    expect(
      Value.Check(schema, [{ Разрешение: "Неизвестно", Использовать: "Истина", Описание: "" }])
    ).toBe(false)
    expect(Value.Check(schema, [{ Разрешение: "Камера", Использовать: "Истина" }])).toBe(false)
  })

  it("registers all atomic type handlers", () => {
    expect(getTypeRule("RequiredMobileApplicationPermissions", "importFromXML")).toBe(
      importRequiredMobileApplicationPermissionsFromXML
    )
    expect(getTypeRule("RequiredMobileApplicationPermissions", "exportToXML")).toBe(
      exportRequiredMobileApplicationPermissionsToXML
    )
    expect(getTypeRule("RequiredMobileApplicationPermissions", "importFromYAML")).toBe(
      importRequiredMobileApplicationPermissionsFromYAML
    )
    expect(getTypeRule("RequiredMobileApplicationPermissions", "exportToYAML")).toBe(
      exportRequiredMobileApplicationPermissionsToYAML
    )
    expect(getTypeRule("RequiredMobileApplicationPermissions", "exportToJSONSchema")).toBe(
      exportRequiredMobileApplicationPermissionsToJSONSchema
    )
  })
})
