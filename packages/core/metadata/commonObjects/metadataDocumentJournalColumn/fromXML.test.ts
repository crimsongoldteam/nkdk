import { describe, expect, it } from "vitest"
import { columnsFromXML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataDocumentJournalColumns", xml: "Column" } as const

describe("import MetadataDocumentJournalColumns from XML", () => {
  it("imports document journal columns", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "columns.xml",
      xmlRootTag: "Column",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(columnsFromXML)
  })
})
