import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { exportXDTOPackagesToXML } from "./toXML"

const context = mockContextToXML()

describe("exportXDTOPackagesToXML", () => {
  it("выгружает UUID заимствованного пакета как ссылку на объект метаданных", () => {
    expect(
      exportXDTOPackagesToXML(
        context,
        { type: "XDTOPackages" },
        ["70d80fbc-fade-411f-b1bd-5058df6b4362"]
      )
    ).toEqual({
      "xr:Item": [{
        "xr:Presentation": "",
        "xr:CheckState": 0,
        "xr:Value": {
          "_xsi:type": "xr:MDObjectRef",
          "#text": "70d80fbc-fade-411f-b1bd-5058df6b4362",
        },
      }],
    })
  })
})
