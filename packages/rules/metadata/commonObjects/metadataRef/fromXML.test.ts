import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importMetadataItemLinkFromXML, metadataPropertyRule002 } from "./fromXML"

describe("importMetadataItemLinkFromXML", () => {
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
