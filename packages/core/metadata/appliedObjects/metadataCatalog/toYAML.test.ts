import { describe, expect, it } from "vitest"
import { full, fullYAML, minimal, minimalYAML } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("exportMetadataCatalogToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, full)

    expect(result).toEqual(fullYAML)
  })

  it("should export minimal", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, minimal)

    expect(result).toEqual(minimalYAML)
  })
})
