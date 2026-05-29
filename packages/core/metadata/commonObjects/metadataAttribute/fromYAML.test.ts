import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  fullMetadataAttributesYAML,
  minimalMetadataAttributes,
  minimalMetadataAttributesYAML,
  shortMetadataAttribute,
  shortMetadataAttributeYAML,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeYAML,
} from "./__fixtures__/data"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule = { type: "MetadataAttributes" } as const

describe("import MetadataAttributes from YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullMetadataAttributesYAML })
    expect(result).toEqual(fullMetadataAttributes)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalMetadataAttributesYAML })
    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import with short format", () => {
    const result = testImportPropertyFromYAML({ rule, value: shortMetadataAttributeYAML })
    expect(result).toEqual(shortMetadataAttribute)
  })

  it("should import short TypeDescription typeId object format", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ТестовыйРеквизит: { ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] },
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

  it("should import short multilanguage format", () => {
    const result = testImportPropertyFromYAML({ rule, value: shortMultilanguageMetadataAttributeYAML })
    expect(result).toEqual(shortMultilanguageMetadataAttribute)
  })
})
