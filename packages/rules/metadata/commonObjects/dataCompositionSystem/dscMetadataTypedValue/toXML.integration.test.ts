import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { testMetadataItemYamlRoundTrip } from "../../../../tests/directConversion"
import { dcsMetadataTypedValueFixtures, emptyValueListTypedValue } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DcsMetadataTypedValue" as any,
  yaml: "value",
}

const undefinedTypeReferenceValue = {
  "_xmlns:d8p1": "http://v8.1c.ru/8.2/data/types",
  "_xsi:type": "v8:Type",
  "#text": "d8p1:Undefined",
}

describe("export DcsMetadataTypedValue to XML", () => {
  it.each(dcsMetadataTypedValueFixtures)("exports $name", (fixture) => {
    const { result } = testAtomicToXML({
      rule,
      value: fixture.model,
      xmlRootTag: "value",
    })

    expect(result).toEqual(fixture.XML)
  })

  it("exports empty ValueListType", () => {
    const { result, expectedResult } = testAtomicToXML({
      rule,
      value: emptyValueListTypedValue,
      xmlRootTag: "value",
      path: "emptyValueList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports ref as xr DesignTimeRef", () => {
    const { result } = testAtomicToXML({
      rule,
      value: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xr:DesignTimeRef">Catalog.Организации.EmptyRef</value>')
  })

  it("does not restore missing value from reference v8 Type Undefined", () => {
    const { result } = testAtomicToXML({
      rule,
      value: undefined,
      referenceMetadata: undefinedTypeReferenceValue,
      xmlRootTag: "value",
    })

    expect(result).toEqual("")
  })

  it.each(["", '<value xsi:type="xs:string">x</value>'])("preserves v8 Type Undefined through YAML: %s", (prefix) => {
    const sourceXML = `<Root>${prefix}<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value></Root>`
    const result = testMetadataItemYamlRoundTrip({ sourceXML, rule: {
      itemType: "TypedValueProbe", properties: {
        root: { type: "XMLRoot", container: "Root", isFileRoot: true, xmlOnly: true, rootAttributes: {} },
        value: { type: "DcsMetadataTypedValue", xml: "value", yaml: "Значение" },
      },
    } })
    expect(result.yamlText).toContain("!xml/raw")
    expect(result.result.replace(/>\s+</g, "><").replace(/^\ufeff?<\?xml[^>]+>\s*/, "")).toBe(sourceXML)
  })

  it("does not invent xsi:nil from a missing reference array slot", () => {
    const { result } = testAtomicToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      referenceMetadata: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xsi:type="xs:string">x</value>\n<value xsi:type="xs:string">y</value>'
    )
  })

  it("does not invent xsi:nil without a reference array slot", () => {
    const { result } = testAtomicToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined],
      referenceMetadata: [{ type: "string", value: "x" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xs:string">x</value>')
  })

  it("ignores invalid reference v8 Type value", () => {
    expect(testAtomicToXML({
        rule,
        value: undefined,
        referenceMetadata: {
          ...undefinedTypeReferenceValue,
          "#text": "d8p1:String",
        },
        xmlRootTag: "value",
      }).result).toBe("")
  })

  it("reports missing toXML handler for unknown runtime typed value", () => {
    expect(() =>
      testAtomicToXML({
        rule,
        value: { type: "UnknownDcsTypedValue", value: "x" },
        xmlRootTag: "value",
      })
    ).toThrow(
      "DcsMetadataTypedValue: отсутствует toXML-обработчик для типа UnknownDcsTypedValue (rule.type: DcsMetadataTypedValue)"
    )
  })

  it("does not restore unrelated reference metadata", () => {
    const { result } = testAtomicToXML({
      rule,
      value: undefined,
      referenceMetadata: { "_xsi:type": "xs:string", "#text": "x" },
      xmlRootTag: "value",
    })

    expect(result).toEqual("")
  })

  it("exports beginning date as xs:dateTime", () => {
    const { result } = testAtomicToXML({
      rule,
      value: { type: "dateTime", value: "0001-01-01T00:00:00" },
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xs:dateTime">0001-01-01T00:00:00</value>')
  })
})
