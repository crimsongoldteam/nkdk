import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { getMinMaxValueXMLText } from "./types"
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

  it("imports xs:string decimal comma as number", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string">0,005</MinValue>',
      xmlRootTag: "MinValue",
    })

    expect(result).toBe(0.005)
  })

  it("imports typed value without text as undefined", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string"/>',
      xmlRootTag: "MinValue",
    })

    expect(result).toBeUndefined()
  })

  it("imports typed empty text as undefined", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string"></MinValue>',
      xmlRootTag: "MinValue",
    })

    expect(result).toBeUndefined()
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

  it("keeps original XML text for reference import", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string">0,00</MinValue>',
      xmlRootTag: "MinValue",
      forReference: true,
    })

    expect(Number(result)).toBe(0)
    expect(getMinMaxValueXMLText(result)).toBe("0,00")
  })
})
