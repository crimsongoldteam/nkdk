import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { xmlImport } from "~/lib/xml/import/importer"
import { exportUserVisibleToXML } from "./exportToXML"
import { importUserVisibleFromXML } from "./importFromXML"
import { UserVisible, UserVisibleXML } from "./types"

describe("exportUserVisibleToXML", () => {
  it("should export UserVisible to XML", () => {
    const mockUserVisible: UserVisible = {
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

    const exported = exportUserVisibleToXML(mockUserVisible, mockConfigurationSettings)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export UserVisible to XML with empty values", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [],
    }

    const expectedResult = `<UserVisible>
	<xr:Common>false</xr:Common>
</UserVisible>`

    const exported = exportUserVisibleToXML(mockUserVisible, mockConfigurationSettings)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUserVisibleToXML(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should handle single value in UserVisible", () => {
    const mockUserVisible: UserVisible = {
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

    const exported = exportUserVisibleToXML(mockUserVisible, mockConfigurationSettings)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export and import UserVisible correctly (round-trip)", () => {
    const originalXml = `<UserVisible>
	<xr:Common>true</xr:Common>
	<xr:Value name="Role.Администратор">true</xr:Value>
	<xr:Value name="Role.Пользователь">false</xr:Value>
</UserVisible>`

    const xml = xmlImport<{ UserVisible: UserVisibleXML }>(originalXml)
    const imported = importUserVisibleFromXML(xml.UserVisible, mockConfigurationSettings)
    const exported = exportUserVisibleToXML(imported, mockConfigurationSettings)
    const resultXml = xmlExport({ UserVisible: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
