import { describe, expect, it } from "vitest"
import { catalogTabularAttributeTypeLink } from "./__fixtures__/data"
import { exportTypeLinkWithXSITypeToXML } from "./toXML"
import { PropertyRule } from "../../orchestration"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { xmlExport } from "../../../xml/export/exporter"

const rule: PropertyRule = {
  type: "TypeLink",
}

describe("export TypeLink to XML", () => {
  it("exports simple.xml", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: catalogTabularAttributeTypeLink,
      xmlRootTag: "TypeLink",
      importMetaUrl: import.meta.url,
      path: "simple.xml",
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports withXSIType.xml", () => {
    const exported = exportTypeLinkWithXSITypeToXML(mockContext, mockRule, catalogTabularAttributeTypeLink)
    const xml = xmlExport({ TypeLink: exported }, false)

    expect(xml).toEqual(readXMLFixtureAsString(import.meta.url, "withXSIType.xml"))
  })
})
