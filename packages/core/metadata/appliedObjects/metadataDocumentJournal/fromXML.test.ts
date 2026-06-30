import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDocumentJournalRules } from "./rules"
import { MetadataDocumentJournal } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataDocumentJournal from XML", () => {
  it("should import full", () => {
    const result = testImportAppliedObjectFromXML<MetadataDocumentJournal>({
      rule: MetadataDocumentJournalRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result).toEqual(full)
    expect(result?.registeredDocuments).toEqual([
      "Document.ДокументВсеСвойства",
      "Document.ДокументДругойДляЖурнала",
    ])
    expect(result?.columns).toHaveLength(2)
    expect(result?.standardAttributes?.map((attribute: { name: string }) => attribute.name)).toEqual(["Ref", "Date"])
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataDocumentJournal>({
        rule: MetadataDocumentJournalRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataDocumentJournal>({
        rule: MetadataDocumentJournalRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataDocumentJournalRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
      if (fixture === "full.xml") {
        expect(result).toContain('<xr:StandardAttribute name="Type">')
      }
    }
  )
})
