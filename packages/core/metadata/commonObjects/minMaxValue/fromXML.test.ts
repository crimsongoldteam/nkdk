import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import "./fromXML"

const rule: PropertyRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
}

describe("importMinMaxValueFromXML", () => {
  it("imports xs:string as number", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string">1</MinValue>',
      xmlRootTag: "MinValue",
    })

    expect(result).toBe(1)
  })

  it("imports xs:string as empty boxed number for reference", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string">1</MinValue>',
      xmlRootTag: "MinValue",
      forReference: true,
    })

    expect(Number(result)).toBe(1)
    expect(Object.keys(Object(result))).toEqual([])
  })
})
