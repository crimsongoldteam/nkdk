import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import "./register"

const rule = { type: "MetadataExternalDataSourceCubeResource", xml: "Resource" } as const

describe("MetadataExternalDataSourceCubeResource XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (path) => {
    const data = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "Resource",
      importMetaUrl: import.meta.url,
    })

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: data,
      xmlRootTag: "Resource",
      path,
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("does not export non-cube resource defaults without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        name: "РесурсКуба",
        type: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
        nameInDataSource: "ResourceInDataSource",
      },
      xmlRootTag: "Resource",
      referenceMetadata: undefined,
    })

    expect(result).not.toContain("<Balance>")
    expect(result).not.toContain("<ChoiceFoldersAndItems>")
    expect(result).not.toContain("<ChoiceHistoryOnInput>")
    expect(result).not.toContain("<CreateOnInput>")
    expect(result).not.toContain("<DataHistory>")
    expect(result).not.toContain("<FillChecking>")
    expect(result).not.toContain("<FillFromFillingValue>")
    expect(result).not.toContain("<FullTextSearch>")
    expect(result).not.toContain("<Indexing>")
  })
})
