import { describe, expect, it } from "vitest"
import { mockContextToYAML } from "~/tests/mockContext"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
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

  it("should export chart of characteristic types catalog owner", () => {
    const result = exportMetadataCatalogToYAML(mockContextToYAML, {
      itemType: "MetadataCatalog",
      name: "ВариантыОтветовАнкет",
      owners: ["ChartOfCharacteristicTypes.ВопросыДляАнкетирования"],
    })

    expect(result).toEqual({
      Владельцы: ["ПланВидовХарактеристик.ВопросыДляАнкетирования"],
    })
  })
})
