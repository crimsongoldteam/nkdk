import { describe, it, expect } from "vitest"
import { importPictureFromXML } from "./importFromXML"
import { PictureXML } from "./types"

describe("importPictureFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importPictureFromXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should import standard picture", () => {
    const xmlData: PictureXML = {
      "xr:Ref": "StdPicture.BusinessProcess",
      "xr:LoadTransparent": true,
    }

    const expectedResult = {
      ref: "BusinessProcess",
      type: "StandardPicture",
      loadTransparent: true,
    }

    const result = importPictureFromXML(xmlData)

    expect(result).toEqual(expectedResult)
  })

  it("should import common picture", () => {
    const xmlData: PictureXML = {
      "xr:Ref": "CommonPicture.ОбщаяКартинка1",
      "xr:LoadTransparent": true,
    }

    const expectedResult = {
      ref: "ОбщаяКартинка1",
      type: "CommonPicture",
      loadTransparent: true,
    }

    const result = importPictureFromXML(xmlData)

    expect(result).toEqual(expectedResult)
  })
})
