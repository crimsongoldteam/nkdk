import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import "./register"

const rule = { type: "MetadataExternalDataSourceCubeDimension", xml: "Dimension" } as const

describe("MetadataExternalDataSourceCubeDimension XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "Dimension",
      importMetaUrl: import.meta.url,
    })

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "Dimension",
      path,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("does not export non-cube dimension defaults without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        name: "ИзмерениеКуба",
        type: { type: ["string"] },
      },
      xmlRootTag: "Dimension",
      referenceMetadata: undefined,
    })

    expect(result).not.toContain("<Balance>")
    expect(result).not.toContain("<BaseDimension>")
    expect(result).not.toContain("<DataHistory>")
    expect(result).not.toContain("<DenyIncompleteValues>")
    expect(result).not.toContain("<FullTextSearch>")
    expect(result).not.toContain("<Indexing>")
    expect(result).not.toContain("<MainFilter>")
    expect(result).not.toContain("<Master>")
    expect(result).not.toContain("<TypeReductionMode>")
    expect(result).not.toContain("<UseInTotals>")
  })
})
