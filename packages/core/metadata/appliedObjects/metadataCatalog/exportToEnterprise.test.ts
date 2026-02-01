import { describe, expect, it } from "vitest"
import { full, fullEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext } from "~/tests/mockContext"
import { exportMetadataCatalogToEnterprise } from "./exportToEnterprise"

describe("exportMetadataCatalogToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, full)

    expect(result).toEqual(fullEnterprise)
  })

  it("should export minimal", () => {
    const result = exportMetadataCatalogToEnterprise(mockContext, minimal)

    expect(result).toEqual(minimalEnterprise)
  })
})
