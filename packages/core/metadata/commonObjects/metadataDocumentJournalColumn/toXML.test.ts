import { describe, expect, it } from "vitest"
import { columnsFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataDocumentJournalColumns", xml: "Column" } as const

describe("export MetadataDocumentJournalColumns to XML", () => {
  it("round-trips document journal columns", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: columnsFromXML,
      xmlRootTag: "Column",
      path: "columns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
