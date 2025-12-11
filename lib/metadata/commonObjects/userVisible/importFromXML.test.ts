import { describe, expect, it } from "vitest"
import { importUserVisibleFromXML } from "./importFromXML"
import { UserVisible, UserVisibleXML } from "./types"
import { xmlImport } from "~/lib"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const mockXml = `<UserVisible>
      <xr:Common>true</xr:Common>
      <xr:Value name="Role.Администратор">true</xr:Value> 
      <xr:Value name="Role.Пользователь">false</xr:Value>
    </UserVisible>`

    const expectedResult: UserVisible = {
      common: true,
      values: [
        {
          name: "Администратор",
          value: true,
        },
        {
          name: "Пользователь",
          value: false,
        },
      ],
    }

    const xml = xmlImport<{ UserVisible: UserVisibleXML }>(mockXml)

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should import Use from XML with empty values", () => {
    const mockXml = `<UserVisible>
      <xr:Common>false</xr:Common>
    </UserVisible>`

    const expectedResult: UserVisible = {
      common: false,
      values: [],
    }

    const xml = xmlImport<{ UserVisible: UserVisibleXML }>(mockXml)

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const mockXml = `<UserVisible>
      <xr:Common>true</xr:Common>
      <xr:Value name="Role.Менеджер">true</xr:Value>
    </UserVisible>`

    const expectedResult: UserVisible = {
      common: true,
      values: [
        {
          name: "Менеджер",
          value: true,
        },
      ],
    }

    const xml = xmlImport<{ UserVisible: UserVisibleXML }>(mockXml)

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })
})
