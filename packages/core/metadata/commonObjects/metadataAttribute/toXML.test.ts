import { describe, expect, it } from "vitest"
import { MetadataAttributeRules } from "./rules"
import { fullFromXML, minimalFromXML, multipleFromXML } from "./__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataAttributes", xml: "Attribute" } as const

describe("export MetadataAttributes to XML", () => {
  it("should export minimal (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalFromXML,
      xmlRootTag: "Attribute",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export multiple (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multipleFromXML,
      xmlRootTag: "Attribute",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export full (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullFromXML,
      xmlRootTag: "Attribute",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export empty string when data is undefined", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "Attribute",
      referenceMetadata: undefined,
    })
    expect(result).toEqual("")
  })

  it("preserves minValue xsi type from reference", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: testImportPropertyFromXML({
        rule: MetadataAttributeRules.properties.minValue,
        xmlString: '<MinValue xsi:type="xs:string">1</MinValue>',
        xmlRootTag: "MinValue",
        forReference: true,
      }),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("fresh export MinValue uses rule typedXML", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: undefined,
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })
})
