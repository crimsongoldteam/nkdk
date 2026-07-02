import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributesFromCompactYAML,
  fullMetadataAttributesYAML,
  minimalMetadataAttributes,
  minimalMetadataAttributesYAML,
  shortMetadataAttribute,
  shortMetadataAttributeYAML,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeYAML,
} from "./__fixtures__/data"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataAttributesToJSONSchema } from "./register"
import { importPropertyFromYAML } from "../../orchestration/property/fromYAML"
import type { ConfigurationContext } from "../../context/types"

const rule = { type: "MetadataAttributes" } as const
const metadataAttributeOwnerContext: ConfigurationContext = {
  ...mockContext,
  importFromYAML: {
    metadataTargetOwners: [
      { itemType: "MetadataCatalog", name: "Справочник", owner: { root: "Catalog", objectName: "Справочник" } },
    ],
  },
}

describe("import MetadataAttributes from YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importPropertyFromYAML({
      context: metadataAttributeOwnerContext,
      rule,
      value: fullMetadataAttributesYAML,
    })
    expect(result).toEqual(fullMetadataAttributesFromCompactYAML)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalMetadataAttributesYAML })
    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import object format", () => {
    const result = testImportPropertyFromYAML({ rule, value: shortMetadataAttributeYAML })
    expect(result).toEqual(shortMetadataAttribute)
  })

  it("should reject scalar short format", () => {
    expect(() =>
      testImportPropertyFromYAML({
        rule,
        value: {
          ТестовыйРеквизит: "Строка",
        },
      })
    ).toThrow("MetadataAttribute: ожидался YAML-объект")
  })

  it("should import TypeDescription typeId object format", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ТестовыйРеквизит: { Тип: { ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] } },
      },
    })

    expect(result).toEqual([
      {
        itemType: "MetadataAttribute",
        name: "ТестовыйРеквизит",
        type: {
          type: [],
          typeId: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"],
        },
        synonym: { items: { ru: "Тестовый реквизит" } },
      },
    ])
  })

  it("should import multilanguage object format", () => {
    const result = testImportPropertyFromYAML({ rule, value: shortMultilanguageMetadataAttributeYAML })
    expect(result).toEqual(shortMultilanguageMetadataAttribute)
  })

  it("should reject scalar values in JSON Schema", () => {
    const schema = exportMetadataAttributesToJSONSchema({ context: mockContext, rule, value: undefined })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check({ Организация: "Справочник.Организации" })).toBe(false)
    expect(compiled.Check({ Организация: { Тип: "Справочник.Организации" } })).toBe(true)
  })
})
