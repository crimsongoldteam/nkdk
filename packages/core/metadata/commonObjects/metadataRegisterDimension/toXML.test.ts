import { describe, expect, it } from "vitest"
import { dimensionsFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterDimensions", xml: "Dimension" } as const

describe("export MetadataRegisterDimensions to XML", () => {
  it("round-trips register dimensions", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: dimensionsFromXML,
      xmlRootTag: "Dimension",
      path: "dimensions.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          itemType: "MetadataRegisterDimension",
          name: "Организация",
          synonym: { items: { ru: "Организация" } },
          type: { type: ["boolean"] },
        },
      ],
      xmlRootTag: "Dimension",
      referenceMetadata: [
        {
          itemType: "MetadataRegisterDimension",
          name: "Организация",
          synonym: { items: {} },
          type: { type: ["boolean"] },
        },
      ],
    })

    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:item>")
  })
})
