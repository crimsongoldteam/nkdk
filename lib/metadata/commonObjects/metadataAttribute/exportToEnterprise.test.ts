import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportMetadataAttributeToEnterprise } from "./exportToEnterprise"
import { MetadataAttribute, MetadataAttributeEnterprise } from "./types"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export metadata attribute to enterprise", () => {
    const metadataAttribute: MetadataAttribute = {
      name: "ТестовыйРеквизит",
      synonym: { items: { ru: "Какой-то тестовый реквизит" } },
      type: { type: ["string"] },
    }

    const expectedResult: MetadataAttributeEnterprise = {
      Тип: "Строка",
      Синоним: "Тестовый реквизит",
    }

    const result = exportMetadataAttributeToEnterprise(metadataAttribute, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata attribute to enterprise with short format", () => {
    const metadataAttribute: MetadataAttribute = {
      name: "ТестовыйРеквизит",
      synonym: { items: { ru: "Тестовый реквизит" } },
      type: { type: ["string"] },
    }

    const expectedResult: MetadataAttributeEnterprise = "Строка"

    const result = exportMetadataAttributeToEnterprise(metadataAttribute, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
