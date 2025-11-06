import { describe, expect, it } from "vitest"
import importUserVisibleFromXML from "./importFromXML"
import { TUserVisible, TUserVisibleXML, ZUserVisibleXML } from "./types"
import z from "zod"
import { xmlImport } from "~/lib"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const mockXml = `<UserVisible>
      <Common>true</Common>
      <Value>
        <Item name="Role.Администратор">true</Item>
        <Item name="Role.Пользователь">false</Item>
      </Value>
    </UserVisible>`

    const expectedResult = {
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

    const xml = xmlImport<{ UserVisible: TUserVisibleXML }>(
      mockXml,
      z.object({ UserVisible: ZUserVisibleXML })
    )

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should import Use from XML with empty values", () => {
    const mockXml = `<UserVisible>
      <Common>false</Common>
      <Value />
    </UserVisible>`

    const expectedResult: TUserVisible = {
      common: false,
      values: [],
    }

    const xml = xmlImport<{ UserVisible: TUserVisibleXML }>(
      mockXml,
      z.object({ UserVisible: ZUserVisibleXML })
    )

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const mockXml = `<UserVisible>
      <Common>true</Common>
      <Value>
        <Item name="Role.Менеджер">true</Item>
      </Value>
    </UserVisible>`

    const expectedResult: TUserVisible = {
      common: true,
      values: [
        {
          name: "Менеджер",
          value: true,
        },
      ],
    }

    const xml = xmlImport<{ UserVisible: TUserVisibleXML }>(
      mockXml,
      z.object({ UserVisible: ZUserVisibleXML })
    )

    const result = importUserVisibleFromXML(xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })
})
