import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlImport } from "~/lib/xml/import/importer"
import { importChoiceParameterLinksFromXML } from "./importFromXML"
import { ChoiceParameterLinksXML } from "./types"

describe("importChoiceParameterLinksFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromXML(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should import ChoiceParameterLinks with single Link", () => {
    const xmlData = `<ChoiceParameterLinks>
			<xr:Link>
				<xr:Name>Отбор.ИмяПредопределенныхДанных</xr:Name>
				<xr:DataPath xsi:type="xs:string">Объект.PredefinedDataName</xr:DataPath>
				<xr:ValueChange>Clear</xr:ValueChange>
			</xr:Link>
		</ChoiceParameterLinks>`

    const expectedResult = [
      {
        name: "Отбор.ИмяПредопределенныхДанных",
        dataPath: "Объект.PredefinedDataName",
        valueChange: "Clear",
      },
    ]

    const xml = xmlImport<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(xmlData)
    const result = importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with multiple Links", () => {
    const xmlData = `<ChoiceParameterLinks>
			<xr:Link>
				<xr:Name>Отбор.ИмяПредопределенныхДанных</xr:Name>
				<xr:DataPath xsi:type="xs:string">Объект.PredefinedDataName</xr:DataPath>
				<xr:ValueChange>Clear</xr:ValueChange>
			</xr:Link>
			<xr:Link>
				<xr:Name>Отбор.ДругоеПоле</xr:Name>
				<xr:DataPath>Объект.ДругоеПоле</xr:DataPath>
			</xr:Link>
		</ChoiceParameterLinks>`

    const expectedResult = [
      {
        name: "Отбор.ИмяПредопределенныхДанных",
        dataPath: "Объект.PredefinedDataName",
        valueChange: "Clear",
      },
      {
        name: "Отбор.ДругоеПоле",
        dataPath: "Объект.ДругоеПоле",
        valueChange: undefined,
      },
    ]

    const xml = xmlImport<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(xmlData)
    const result = importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should import ChoiceParameterLinks with DataPath as string", () => {
    const xmlData = `<ChoiceParameterLinks>
			<xr:Link>
				<xr:Name>Отбор.Поле</xr:Name>
				<xr:DataPath>Объект.Поле</xr:DataPath>
			</xr:Link>
		</ChoiceParameterLinks>`

    const expectedResult = [
      {
        name: "Отбор.Поле",
        dataPath: "Объект.Поле",
        valueChange: undefined,
      },
    ]

    const xml = xmlImport<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(xmlData)
    const result = importChoiceParameterLinksFromXML(xml.ChoiceParameterLinks, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
