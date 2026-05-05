import { describe, expect, it } from "vitest"
import { fullFromXML, minimalFromXML } from "./__fixtures__/data"
import { exportPropertyToXML, importPropertyFromXML } from "~/metadata/orchestration"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"

const rule = { type: "MetadataTabularSections", xml: "TabularSection" } as const

const exportAndReimport = (value: unknown) => {
  const exportContext = mockContextToXML()
  // exportPropertyToXML for a collection returns an array directly (since rule.xml === xmlElement in factory)
  const xmlArray = exportPropertyToXML({ context: exportContext, rule, value, referenceMetadata: undefined })
  setIdsToElements(exportContext)
  if (!xmlArray) return undefined
  const xmlString = xmlExport({ TabularSection: xmlArray }, false)
  if (!xmlString) return undefined
  const parsed = importContentFromXML<Record<string, unknown>>(xmlString)
  return importPropertyFromXML({ context: mockContextFromXML(), rule, value: parsed["TabularSection"] })
}

describe("export MetadataTabularSections to XML", () => {
  it("should export full (round-trip)", () => {
    const result = exportAndReimport(fullFromXML)
    expect(result).toEqual(fullFromXML)
  })

  it("should export minimal (round-trip)", () => {
    const result = exportAndReimport(minimalFromXML)
    expect(result).toEqual(minimalFromXML)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportAndReimport(undefined)
    expect(result).toBeUndefined()
  })
})
