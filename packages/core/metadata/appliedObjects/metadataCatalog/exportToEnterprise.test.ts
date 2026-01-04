import { describe, expect, it } from "vitest"
import { full, fullEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/metadataCatalog/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataCatalogToEnterprise } from "./exportToEnterprise"

describe("exportMetadataCatalogToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCatalogToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCatalogToEnterprise(mockСontext, full)

    expect(result).toEqual(fullEnterprise)
  })

  it("should export minimal", () => {
    const result = exportMetadataCatalogToEnterprise(mockСontext, minimal)

    expect(result).toEqual(minimalEnterprise)
  })
})
