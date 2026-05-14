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

  it("does not export invalid reference v8 Type value", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      referenceMetadata: {
        ...undefinedTypeReferenceValue,
        "#text": "d8p1:String",
      },
      xmlRootTag: "value",
    })

    expect(result).toEqual("<value/>")
  })
})
