import { describe, expect, it } from "vitest"
import { dimensionsFromXML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"

const rule = { type: "MetadataRegisterDimensions", xml: "Dimension" } as const

describe("import MetadataRegisterDimensions from XML", () => {
  it("imports register dimensions with UseInTotals", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "dimensions.xml",
      xmlRootTag: "Dimension",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(dimensionsFromXML)
  })
})
