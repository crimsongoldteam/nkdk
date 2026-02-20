import { describe, expect, it } from "vitest"
import { full, fullYAML, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("exportMetadataCatalogToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, mockRule, full)

    expect(result).toEqual(fullYAML)
  })

  it("should export minimal", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, mockRule, minimal)

    expect(result).toBeUndefined()
  })
})
