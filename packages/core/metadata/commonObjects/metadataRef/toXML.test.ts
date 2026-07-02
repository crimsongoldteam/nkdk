import { describe, expect, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { mockContextToXML } from "~/tests/mockContext"
import { exportMetadataItemLinksToXML, exportMetadataItemLinkToXML } from "./toXML"

describe("exportMetadataItemLinkToXML", () => {
  it("exports plain XML text by default", () => {
    const result = exportMetadataItemLinkToXML(mockContextToXML(), undefined, "SettingsStorage.ХранилищеНастроек")

    expect(result).toBe("SettingsStorage.ХранилищеНастроек")
  })

  it("exports typed XML text when rule requests typed XML", () => {
    const rule = { type: "MetadataItemLink", typedXML: "xr:MDObjectRef" } as PropertyRule

    const result = exportMetadataItemLinkToXML(mockContextToXML(), rule, "CommonCommand.ПоказатьВСписке")

    expect(result).toEqual({
      "#text": "CommonCommand.ПоказатьВСписке",
      "_xsi:type": "xr:MDObjectRef",
    })
  })
})

describe("exportMetadataItemLinksToXML", () => {
  it("exports collection items as typed XML text", () => {
    const result = exportMetadataItemLinksToXML(mockContextToXML(), undefined, [
      "CommonCommand.ПоказатьВСписке",
      "SettingsStorage.ХранилищеНастроек",
    ])

    expect(result).toEqual({
      "xr:Item": [
        {
          "#text": "CommonCommand.ПоказатьВСписке",
          "_xsi:type": "xr:MDObjectRef",
        },
        {
          "#text": "SettingsStorage.ХранилищеНастроек",
          "_xsi:type": "xr:MDObjectRef",
        },
      ],
    })
  })
})
