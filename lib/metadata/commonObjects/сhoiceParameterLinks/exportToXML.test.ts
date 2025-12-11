import { expect, it, describe } from "vitest"
import { exportChoiceParameterLinksToXML } from "./exportToXML"
import { importChoiceParameterLinksFromXML } from "./importFromXML"
import { ChoiceParameterLinksXML } from "./types"
import { xmlExport } from "~/lib/xml/export/exporter"
import { xmlImport } from "~/lib/xml/import/importer"

describe("exportChoiceParameterLinksToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParameterLinksToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import choice parameter links with single link correctly (round-trip)", () => {
    const originalXml = `<ChoiceParameterLinks>
	<xr:Link>
		<xr:Name>Отбор.ИмяПредопределенныхДанных</xr:Name>
		<xr:DataPath>Объект.PredefinedDataName</xr:DataPath>
		<xr:ValueChange>Clear</xr:ValueChange>
	</xr:Link>
</ChoiceParameterLinks>`

    const xml = xmlImport<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      originalXml
    )
    const imported = importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks)
    const exported = exportChoiceParameterLinksToXML(imported)
    const resultXml = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import choice parameter links with multiple links correctly (round-trip)", () => {
    const originalXml = `<ChoiceParameterLinks>
	<xr:Link>
		<xr:Name>Отбор.ИмяПредопределенныхДанных</xr:Name>
		<xr:DataPath>Объект.PredefinedDataName</xr:DataPath>
		<xr:ValueChange>Clear</xr:ValueChange>
	</xr:Link>
	<xr:Link>
		<xr:Name>Отбор.ДругоеПоле</xr:Name>
		<xr:DataPath>Объект.ДругоеПоле</xr:DataPath>
	</xr:Link>
</ChoiceParameterLinks>`

    const xml = xmlImport<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      originalXml
    )
    const imported = importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks)
    const exported = exportChoiceParameterLinksToXML(imported)
    const resultXml = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
