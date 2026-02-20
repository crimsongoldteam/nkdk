import { describe, expect, it } from "vitest"
import { full, fullYAML, minimal, minimalYAML } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("importMetadataCatalogFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCatalogFromYAML(mockContext, mockRule, undefined, "Контрагенты")
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCatalogFromYAML(mockContext, mockRule, fullYAML, "Контрагенты")

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataCatalogFromYAML(mockContext, mockRule, minimalYAML, "Контрагенты")

    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportMetadataCatalogToYAML(mockContext, mockRule, minimal)

    expect(result).toBeUndefined()
  })
})
