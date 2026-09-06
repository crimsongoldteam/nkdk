import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importMetadataItemLinkFromXML, importMetadataItemLinksFromXML, metadataPropertyRule002 } from "./fromXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importContentFromXML } from "@nkdk/runtime"
import type { MetadataItemLinksXML } from "./types"

describe("importMetadataItemLinkFromXML", () => {
  it.each([
    ["<Links/>", undefined],
    ["<Links><xr:Item/></Links>", []],
    ["<Links><xr:Item/><xr:Item>Catalog.Элемент</xr:Item></Links>", ["", "Catalog.Элемент"]],
    ["<Links><xr:Item/><xr:Object>Catalog.Элемент</xr:Object></Links>", ["Catalog.Элемент"]],
    ['<Links><xr:Item xsi:type="xr:MDObjectRef">Catalog.Элемент</xr:Item></Links>', ["Catalog.Элемент"]],
  ])("preserves structural collection presence and selection: %s", (xml, expected) => {
    expect(importMetadataItemLinksFromXML(mockContextFromXML(), undefined, importContentFromXML<{ Links?: MetadataItemLinksXML }>(xml).Links)).toEqual(expected)
    expect(importMetadataItemLinksFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("imports plain XML text", () => {
    const result = importMetadataItemLinkFromXML(mockContextFromXML(), undefined, "SettingsStorage.ХранилищеНастроек")

    expect(result).toBe("SettingsStorage.ХранилищеНастроек")
  })

  it("imports typed XML text", () => {
    const result = importMetadataItemLinkFromXML(mockContextFromXML(), undefined, {
      "#text": "CommonCommand.ПоказатьВСписке",
      "_xsi:type": "xr:MDObjectRef",
    })

    expect(result).toBe("CommonCommand.ПоказатьВСписке")
  })

  it("объявляет повторные xr:Item частью одного свойства", () => {
    expect(metadataPropertyRule002.handler.repeatedXMLNodes).toBe(true)
  })
})
