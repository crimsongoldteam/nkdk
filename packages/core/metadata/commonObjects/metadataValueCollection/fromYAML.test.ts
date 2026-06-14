import { describe, expect, it } from "vitest"
import { multiple, multipleYAML, single, singleYAML } from "~/metadata/commonObjects/metadataValueCollection/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataValueCollectionFromYAML } from "./fromYAML"

describe("importMetadataValueCollectionFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataValueCollectionFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = importMetadataValueCollectionFromYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const result = importMetadataValueCollectionFromYAML(mockContext, mockRule, singleYAML)

    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const result = importMetadataValueCollectionFromYAML(mockContext, mockRule, multipleYAML)

    expect(result).toEqual(multiple)
  })

  it("rejects english YAML roots", () => {
    expect(() => importMetadataValueCollectionFromYAML(mockContext, mockRule, ["Catalog.Контрагенты"])).toThrow(
      'Неизвестный корень "Catalog"'
    )
  })
})
