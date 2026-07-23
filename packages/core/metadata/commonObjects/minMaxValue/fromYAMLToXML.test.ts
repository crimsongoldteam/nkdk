import { describe, expect, it } from "vitest"

import type { PropertyRule } from "../../orchestration"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"

import "./fromXML"
import "./toXML"

const rule: PropertyRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
}

describe("MinMaxValue YAML → XML", () => {
  it("exports number as typed decimal without reference", () => {
    expect(convert(1)).toBe('<MinValue xsi:type="xs:decimal">1</MinValue>')
  })

  it("preserves xs:string from reference", () => {
    expect(convert(1, importReference())).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("exports xs:string decimal comma from reference", () => {
    const reference = importReference('<MinValue xsi:type="xs:string">0,005</MinValue>')

    expect(convert(0.005, reference)).toBe('<MinValue xsi:type="xs:string">0,005</MinValue>')
  })

  it("exports xs:decimal decimal dot from reference", () => {
    const reference = importReference('<MinValue xsi:type="xs:decimal">0.005</MinValue>')

    expect(convert(0.005, reference)).toBe('<MinValue xsi:type="xs:decimal">0.005</MinValue>')
  })

  it("preserves xs:string integer decimal comma from reference", () => {
    const reference = importReference('<MinValue xsi:type="xs:string">0,00</MinValue>')

    expect(convert(0, reference)).toBe('<MinValue xsi:type="xs:string">0,00</MinValue>')
  })

  it("formats changed value instead of stale reference XML text", () => {
    const reference = importReference('<MinValue xsi:type="xs:string">0,00</MinValue>')

    expect(convert(1, reference)).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("preserves xs:string non-numeric text from reference for NaN", () => {
    const reference = importReference('<MinValue xsi:type="xs:string">abc</MinValue>')

    expect(convert(Number.NaN, reference)).toBe('<MinValue xsi:type="xs:string">abc</MinValue>')
  })
})

const convert = (yaml: number, referenceValue?: unknown): string => {
  const value = testAtomicFromYAML({ rule, value: yaml, sourceValue: referenceValue })
  return testAtomicToXML({ rule, value, referenceMetadata: referenceValue, xmlRootTag: "MinValue" }).result
}

const importReference = (xmlString = '<MinValue xsi:type="xs:string">1</MinValue>'): unknown =>
  testImportPropertyFromXML({
    rule,
    xmlString,
    xmlRootTag: "MinValue",
    forReference: true,
  })
