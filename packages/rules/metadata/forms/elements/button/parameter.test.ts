import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { importButtonParameterFromXML } from "./parameter"

describe("ButtonParameter structural XML", () => {
  it.each([
    ['<Parameter xsi:type="xr:MDObjectRef">Catalog.Товары</Parameter>', "Catalog.Товары"],
    ['<Parameter xsi:type="v8:TypeDescription"><v8:Type>xs:string</v8:Type></Parameter>', { typeDescription: { type: ["string"] } }],
    ["<Parameter/>", undefined],
  ])("читает %s без объектного XML", (xml, expected) => {
    const node = parseStructuralXMLWithoutCompatibility(xml)
    expect(importButtonParameterFromXML(mockContextFromXML(), undefined, node)).toEqual(expected)
  })
})
