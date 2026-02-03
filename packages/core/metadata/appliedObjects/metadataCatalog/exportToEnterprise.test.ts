import { describe, expect, it } from "vitest"
import { full, fullEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataCatalogToEnterprise } from "./exportToEnterprise"

describe("exportMetadataCatalogToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, mockRule, full)

    expect(result).toEqual(fullEnterprise)
  })

  it("should export minimal", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, mockRule, minimal)

    expect(result).toEqual(minimalEnterprise)
  })
})
