import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import { mockContextToXML } from "~/tests/mockContext"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import "./fromXML"
import "./toXML"

const rule: PropertyRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
}

describe("exportMinMaxValueToXML", () => {
  it("exports number as typed decimal without reference", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: 1,
    })

    expect(result).toEqual({ "_xsi:type": "xs:decimal", "#text": "1" })
  })

  it("preserves xs:string from reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 1,
      referenceMetadata: testImportReference(),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("exports xs:string decimal comma from reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 0.005,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">0,005</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">0,005</MinValue>')
  })

  it("exports xs:decimal decimal dot from reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 0.005,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:decimal">0.005</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:decimal">0.005</MinValue>')
  })

  it("preserves xs:string integer decimal comma from reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 0,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">0,00</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">0,00</MinValue>')
  })

  it("formats changed value instead of stale reference XML text", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 1,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">0,00</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("preserves xs:string non-numeric text from reference for NaN", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: Number.NaN,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">abc</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">abc</MinValue>')
  })
})

const testImportReference = (xmlString = '<MinValue xsi:type="xs:string">1</MinValue>'): unknown => {
  return testImportPropertyFromXML({
    rule,
    xmlString,
    xmlRootTag: "MinValue",
    forReference: true,
  })
}
