import { importContentFromXML } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importDcsLocalStringTypeFromXML } from "./dcsLocalStringType/fromXML"
import type { DcsLocalStringTypeXML } from "./dcsLocalStringType/types"
import { importGroupItemAutoFromXML } from "./structureItemGroup/items/groupItemAuto/fromXML"
import { metadataPropertyRule000 as availableFields } from "./availableFields/fromXML"
import type { AvailableFieldsXML } from "./availableFields/types"

describe("structural DCS selections", () => {
  it("preserves the error for a repeated empty available-field entry", () => {
    const xml = "<Root><dcsset:item/><dcsset:item><dcsset:field>Поле</dcsset:field></dcsset:item></Root>"
    expect(() => availableFields.handler(mockContextFromXML(), mockRule, importContentFromXML<{ Root: AvailableFieldsXML }>(xml).Root)).toThrow(TypeError)
    expect(() => availableFields.handler(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toThrow(TypeError)
  })

  it.each([
    ["<Root/>", undefined],
    ["<Root>Текст</Root>", { kind: "xmlString", text: "Текст" }],
    ['<Root xsi:type="xs:string"/>', { kind: "xmlString", text: "" }],
    ['<Root xsi:type="xs:string">Текст</Root>', { kind: "xmlString", text: "Текст" }],
    ['<Root xsi:type="v8:LocalStringType"><v8:item><v8:lang>ru</v8:lang><v8:content>Заголовок</v8:content></v8:item></Root>', { items: { ru: "Заголовок" } }],
  ])("imports local string %s", (xml, expected) => {
    expect(importDcsLocalStringTypeFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Root: DcsLocalStringTypeXML }>(xml).Root)).toEqual(expected)
    expect(importDcsLocalStringTypeFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it.each([
    ["<Root/>", undefined],
    ["<Root>text</Root>", undefined],
    ['<Root xsi:type="dcsset:GroupItemAuto"/>', { itemType: "GroupItemAuto", use: undefined }],
    ['<Root><dcsset:use>false</dcsset:use></Root>', { itemType: "GroupItemAuto", use: false }],
    ['<Root><dcsset:use>true</dcsset:use></Root>', { itemType: "GroupItemAuto", use: true }],
  ])("imports automatic group %s", (xml, expected) => {
    expect(importGroupItemAutoFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Root: unknown }>(xml).Root)).toEqual(expected)
    expect(importGroupItemAutoFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it.each([
    ["<Root/>", undefined],
    ["<Root><dcsset:item/></Root>", undefined],
    ["<Root><dcsset:item><dcsset:field>Поле</dcsset:field><dcsset:use/></dcsset:item></Root>", ["Поле"]],
    ["<Root><dcsset:item><dcsset:field>Первое</dcsset:field></dcsset:item><dcsset:item><dcsset:field>Второе</dcsset:field><dcsset:use>false</dcsset:use></dcsset:item></Root>", ["Первое", { field: "Второе", use: false }]],
    ["<Root><dcsset:item><dcsset:field>Поле</dcsset:field><dcsset:title><v8:item><v8:lang>ru</v8:lang><v8:content>Название</v8:content></v8:item></dcsset:title></dcsset:item></Root>", [{ field: "Поле", title: { items: { ru: "Название" } } }]],
  ])("imports available fields %s", (xml, expected) => {
    expect(availableFields.handler(mockContextFromXML(), mockRule, importContentFromXML<{ Root: AvailableFieldsXML }>(xml).Root)).toEqual(expected)
    expect(availableFields.handler(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })
})
