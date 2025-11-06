import { describe, expect, it } from "vitest"
import { exportUserVisibleToXML } from "./exportToXML"
import { importUserVisibleFromXML } from "./importFromXML"
import { TUserVisible, TUserVisibleXML, ZUserVisibleXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportUserVisibleToXML", () => {
  it("should export UserVisible to XML", () => {
    const mockUserVisible: TUserVisible = {
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

    const expectedResult = `<UserVisible>
	<xr:Common>true</xr:Common>
	<xr:Value name="Role.Администратор">true</xr:Value>
	<xr:Value name="Role.Пользователь">false</xr:Value>
</UserVisible>`

    const result = { UserVisible: exportUserVisibleToXML(mockUserVisible) }
    const xmlString = xmlExport(
      result,
      z.object({ UserVisible: ZUserVisibleXML }),
      false
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export UserVisible to XML with empty values", () => {
    const mockUserVisible: TUserVisible = {
      common: false,
      values: [],
    }

    const expectedResult = `<UserVisible>
	<xr:Common>false</xr:Common>
</UserVisible>`

    const result = { UserVisible: exportUserVisibleToXML(mockUserVisible) }
    const xmlString = xmlExport(
      result,
      z.object({ UserVisible: ZUserVisibleXML }),
      false
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUserVisibleToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in UserVisible", () => {
    const mockUserVisible: TUserVisible = {
      common: true,
      values: [
        {
          name: "Менеджер",
          value: true,
        },
      ],
    }

    const expectedResult = `<UserVisible>
	<xr:Common>true</xr:Common>
	<xr:Value name="Role.Менеджер">true</xr:Value>
</UserVisible>`

    const result = { UserVisible: exportUserVisibleToXML(mockUserVisible) }
    const xmlString = xmlExport(
      result,
      z.object({ UserVisible: ZUserVisibleXML }),
      false
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export and import UserVisible correctly (round-trip)", () => {
    const originalXml = `<UserVisible>
	<xr:Common>true</xr:Common>
	<xr:Value name="Role.Администратор">true</xr:Value>
	<xr:Value name="Role.Пользователь">false</xr:Value>
</UserVisible>`

    const xml = xmlImport<{ UserVisible: TUserVisibleXML }>(
      originalXml,
      z.object({ UserVisible: ZUserVisibleXML })
    )
    const imported = importUserVisibleFromXML(xml.UserVisible)
    const exported = exportUserVisibleToXML(imported)
    const resultXml = xmlExport(
      { UserVisible: exported },
      z.object({ UserVisible: ZUserVisibleXML }),
      false
    )

    expect(resultXml).toEqual(originalXml)
  })
})
