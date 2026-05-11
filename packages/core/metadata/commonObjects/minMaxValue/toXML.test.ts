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
})

const testImportReference = (): unknown => {
  return testImportPropertyFromXML({
    rule,
    xmlString: '<MinValue xsi:type="xs:string">1</MinValue>',
    xmlRootTag: "MinValue",
    forReference: true,
  })
}
