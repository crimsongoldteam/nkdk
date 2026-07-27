import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { exportXDTOPackagesToXML } from "./toXML"

const context = mockContextToXML()

describe("exportXDTOPackagesToXML", () => {
  it("выгружает имя пакета XDTO как ссылку на объект метаданных", () => {
    expect(
      exportXDTOPackagesToXML(
        context,
        { type: "XDTOPackages" },
        ["XDTOPackage.Основной"]
      )
    ).toEqual({
      "xr:Item": [{
        "xr:Presentation": "",
        "xr:CheckState": 0,
        "xr:Value": {
          "_xsi:type": "xr:MDObjectRef",
          "#text": "XDTOPackage.Основной",
        },
      }],
    })
  })

  it("не считает UUID ссылкой на пакет XDTO", () => {
    const value = "12345678-1234-4234-9234-123456789abc"

    expect(
      exportXDTOPackagesToXML(
        context,
        { type: "XDTOPackages" },
        [value]
      )
    ).toEqual({
      "xr:Item": [{
        "xr:Presentation": "",
        "xr:CheckState": 0,
        "xr:Value": {
          "_xsi:type": "xs:string",
          "#text": value,
        },
      }],
    })
  })
})
