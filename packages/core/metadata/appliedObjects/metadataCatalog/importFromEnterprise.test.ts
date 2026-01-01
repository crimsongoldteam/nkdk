import { describe, expect, it } from "vitest"
import { full, fullEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/metadataCatalog/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataCatalogToEnterprise } from "./exportToEnterprise"
import { importMetadataCatalogFromEnterprise } from "./importFromEnterprise"

describe("importMetadataCatalogFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCatalogFromEnterprise(mockСontext, undefined, "Контрагенты")
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCatalogFromEnterprise(mockСontext, fullEnterprise, "Контрагенты")

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataCatalogFromEnterprise(mockСontext, minimalEnterprise, "Контрагенты")

    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportMetadataCatalogToEnterprise(mockСontext, minimal)

    expect(result).toEqual(minimalEnterprise)
  })
})
