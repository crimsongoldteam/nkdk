import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import {
  exportElementToPartialYAML,
  exportElementToXML,
  importElementFromXML,
  type ElementXML,
} from "~/metadata/orchestration"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { mockContext, mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import {
  nonCanonicalSingletonNames,
  nonCanonicalSingletonNamesYAML,
} from "./table/__fixtures__/nonCanonicalSingletonNames"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "table/__fixtures__")

const readTableXML = () =>
  readAndParseXMLFile<{ Table: ElementXML }>("nonCanonicalSingletonNames.xml", fixturesDir).Table

describe("singleton noncanonical XML names with reference", () => {
  it("imports table without public singleton names", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Table",
      xml: readTableXML(),
    })

    expect(result).toEqual(nonCanonicalSingletonNames)
  })

  it("exports exact noncanonical names from reference", () => {
    const xml = readTableXML()
    const context = mockContextToXML()
    const reference = importElementFromXML({
      context: mockContextFromXML({ forReference: true }),
      itemType: "Table",
      xml,
    })

    const result = exportElementToXML({
      context,
      element: nonCanonicalSingletonNames,
      referenceElement: reference,
    })

    setIdsToElements(context)
    const xmlString = xmlExport({ Table: result }, false)
    expect(xmlString).toEqual(readXMLFileAsString("nonCanonicalSingletonNames.xml", fixturesDir).trimEnd())
  })

  it("exports YAML without public singleton Имя fields", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: nonCanonicalSingletonNames })

    expect(result).toEqual(nonCanonicalSingletonNamesYAML)
    expect(JSON.stringify(result)).not.toContain("\"Имя\"")
    expect(JSON.stringify(result)).not.toContain("ТаблицаЭП")
  })
})
