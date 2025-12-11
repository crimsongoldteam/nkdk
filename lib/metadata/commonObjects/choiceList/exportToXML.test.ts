import { expect, it, describe } from "vitest"
import { exportChoiceListToXML } from "./exportToXML"
import { importChoiceListFromXML } from "./importFromXML"
import { ChoiceList, ChoiceListXML } from "./types"
import { xmlExport } from "~/lib/xml/export/exporter"
import { xmlImport } from "~/lib/xml/import/importer"

describe("exportChoiceListToXML", () => {
  it("should export choice list to XML", () => {
    const mockChoiceList: ChoiceList = {
      items: [
        {
          presentation: { items: { ru: "Представление 1" } },
          checkState: 0,
          value: "Значение 1",
        },
        {
          presentation: { items: { ru: "Представление 2" } },
          checkState: 1,
          value: "Значение 2",
        },
      ],
    }

    const expectedResult = `<ChoiceList>
	<xr:Item>
		<xr:CheckState>0</xr:CheckState>
		<xr:Value xsi:type="FormChoiceListDesTimeValue">
			<Presentation>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Представление 1</v8:content>
				</v8:item>
			</Presentation>
			<Value xsi:type="xs:string">Значение 1</Value>
		</xr:Value>
	</xr:Item>
	<xr:Item>
		<xr:CheckState>1</xr:CheckState>
		<xr:Value xsi:type="FormChoiceListDesTimeValue">
			<Presentation>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Представление 2</v8:content>
				</v8:item>
			</Presentation>
			<Value xsi:type="xs:string">Значение 2</Value>
		</xr:Value>
	</xr:Item>
</ChoiceList>`

    const result = { ChoiceList: exportChoiceListToXML(mockChoiceList) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import choice list correctly (round-trip)", () => {
    const originalXml = `<ChoiceList>
	<xr:Item>
		<xr:CheckState>0</xr:CheckState>
		<xr:Value xsi:type="FormChoiceListDesTimeValue">
			<Presentation>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Представление 1</v8:content>
				</v8:item>
			</Presentation>
			<Value xsi:type="xs:string">Значение 1</Value>
		</xr:Value>
	</xr:Item>
	<xr:Item>
		<xr:CheckState>1</xr:CheckState>
		<xr:Value xsi:type="FormChoiceListDesTimeValue">
			<Presentation>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Представление 2</v8:content>
				</v8:item>
			</Presentation>
			<Value xsi:type="xs:string">Значение 2</Value>
		</xr:Value>
	</xr:Item>
</ChoiceList>`

    const xml = xmlImport<{ ChoiceList: ChoiceListXML }>(originalXml)
    const imported = importChoiceListFromXML(xml.ChoiceList)
    const exported = exportChoiceListToXML(imported)
    const resultXml = xmlExport({ ChoiceList: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
