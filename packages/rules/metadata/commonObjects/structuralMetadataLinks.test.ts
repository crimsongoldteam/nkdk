import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../tests/structuralXML"
import { importMetadataItemLinkFromXML } from "./metadataRef/fromXML"
import { importMetadataFieldFromXML, importMetadataFieldsFromXML } from "./metadataField/fromXML"
import { mockContextFromXML } from "../../tests/mockContext"
import { importMetadataCommandGroupFromXML } from "./metadataCommandGroup/fromXML"

describe("structural metadata link values", () => {
  it.each([
    ["<Fields/>", undefined],
    ["<Fields><xr:Field/></Fields>", [undefined]],
    ["<Fields><xr:Field>А</xr:Field><xr:Field>Б</xr:Field></Fields>", ["А", "Б"]],
  ])("reads the metadata field collection: %s", (xml, expected) => {
    expect(importMetadataFieldsFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  for (const read of [importMetadataItemLinkFromXML, importMetadataFieldFromXML, importMetadataCommandGroupFromXML]) {
    it.each([
      ["<Value/>", undefined],
      ["<Value>Catalog.Элемент</Value>", "Catalog.Элемент"],
      ['<Value xsi:type="xr:MDObjectRef">Catalog.Элемент</Value>', "Catalog.Элемент"],
      ['<Value xsi:type="xr:MDObjectRef"/>', undefined],
    ])(`${read.name} reads %s`, (xml, expected) => {
      expect(read(mockContext, undefined, parseStructuralXMLWithoutCompatibility(xml))).toBe(expected)
    })
  }
})
