import { describe, it, expect } from "vitest"
import importPictureFromXML from "./importFromXML"

describe("importPictureFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importPictureFromXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should import standard picture", () => {
    const xmlData = {
      Ref: "StdPicture.BusinessProcess",
      LoadTransparent: true,
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
    const xmlData = {
      Ref: "CommonPicture.ОбщаяКартинка1",
      LoadTransparent: true,
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
