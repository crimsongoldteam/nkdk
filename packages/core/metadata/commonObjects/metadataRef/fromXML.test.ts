import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { importMetadataItemLinkFromXML } from "./fromXML"

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
})
