import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
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
    const { result } = testExportPropertyToXML({
      rule,
      value: fixture.model,
      xmlRootTag: "value",
    })

    expect(result).toEqual(fixture.XML)
  })

  it("exports empty ValueListType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: emptyValueListTypedValue,
      xmlRootTag: "value",
      path: "emptyValueList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports missing value from reference v8 Type Undefined", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      referenceMetadata: undefinedTypeReferenceValue,
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>'
    )
  })

  it("exports reference-only v8 Type Undefined when passed as value", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefinedTypeReferenceValue,
      referenceMetadata: undefinedTypeReferenceValue,
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>'
    )
  })

  it("exports reference-only v8 Type Undefined inside value array", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefinedTypeReferenceValue],
      referenceMetadata: [{ type: "string", value: "x" }, undefinedTypeReferenceValue],
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xsi:type="xs:string">x</value>\n' +
        '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>'
    )
  })

  it("exports missing array item as xsi:nil only when reference slot is missing too", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      referenceMetadata: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xsi:type="xs:string">x</value>\n<value xsi:nil="true"/>\n<value xsi:type="xs:string">y</value>'
    )
  })

  it("does not invent xsi:nil without a reference array slot", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined],
      referenceMetadata: [{ type: "string", value: "x" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xs:string">x</value>')
  })

  it("does not export invalid reference v8 Type value", () => {
    expect(() =>
      testExportPropertyToXML({
        rule,
        value: undefined,
        referenceMetadata: {
          ...undefinedTypeReferenceValue,
          "#text": "d8p1:String",
        },
        xmlRootTag: "value",
      })
    ).toThrow("DcsMetadataTypedValue XML: unsupported reference v8:Type")
  })

  it("reports missing toXML handler for unknown runtime typed value", () => {
    expect(() =>
      testExportPropertyToXML({
        rule,
        value: { type: "UnknownDcsTypedValue", value: "x" },
        xmlRootTag: "value",
      })
    ).toThrow(
      "DcsMetadataTypedValue: отсутствует toXML-обработчик для типа UnknownDcsTypedValue (rule.type: DcsMetadataTypedValue)"
    )
  })

  it("does not restore unrelated reference metadata", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      referenceMetadata: { "_xsi:type": "xs:string", "#text": "x" },
      xmlRootTag: "value",
    })

    expect(result).toEqual("<value/>")
  })
})
