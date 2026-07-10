import { describe, expect, it } from "vitest"
import { UUID_TEST } from "../../helpers/uuid"
import { exportMetadataItemToXML } from "../../orchestration"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDocumentNumeratorRules } from "./rules"

describe("export MetadataDocumentNumerator to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
  ])("should export $fixture", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataDocumentNumeratorRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })

  it("экспортирует корневой uuid без reference", () => {
    const xmlData = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: minimal,
      rule: MetadataDocumentNumeratorRules,
    })

    expect(xmlExport(xmlData!)).toContain(`<DocumentNumerator uuid="${UUID_TEST}">`)
  })
})
