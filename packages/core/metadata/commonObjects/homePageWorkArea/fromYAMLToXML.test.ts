import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import { HomePageWorkAreaRules } from "./rules"
import type { HomePageWorkAreaYAML } from "./types"

import "./register"

const HOME_PAGE_WORK_AREA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HomePageWorkArea xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<WorkingAreaTemplate>TwoColumnsVariableWidth</WorkingAreaTemplate>
	<LeftColumn>
		<Item>
			<Form>CommonForm.НачалоРаботы</Form>
			<Height>100</Height>
			<Visibility>
				<xr:Common>true</xr:Common>
				<xr:Value name="Role.Администратор">false</xr:Value>
			</Visibility>
		</Item>
	</LeftColumn>
	<RightColumn>
		<Item>
			<Form>DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр</Form>
			<Height>10</Height>
			<Visibility>
				<xr:Common>false</xr:Common>
			</Visibility>
		</Item>
	</RightColumn>
	<MACommandInterfaceDisplays>Top</MACommandInterfaceDisplays>
</HomePageWorkArea>`

const yaml: HomePageWorkAreaYAML = {
  ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
  ЛеваяКолонка: [
    {
      Форма: "CommonForm.НачалоРаботы",
      Высота: 100,
      Видимость: { Общее: "Истина", Роли: { Администратор: "Ложь", ПолныеПрава: "Истина" } },
    },
  ],
  ПраваяКолонка: [
    {
      Форма: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
      Высота: 10,
      Видимость: { Общее: "Ложь" },
    },
  ],
  ОтображениеКомандногоИнтерфейса: "Верх",
}

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\ufeff/, "").trimEnd()

const exportYAML = (value: HomePageWorkAreaYAML, referenceXML?: unknown): string =>
  normalizeXML(
    serializeDirectXML(
      testMetadataItemFromYAMLToXML({ rule: HomePageWorkAreaRules, yaml: value, referenceXML }).xml
    )
  )

const roundTrip = (xmlString: string, mutate?: (value: HomePageWorkAreaYAML) => void): string => {
  const referenceXML = importContentFromXML(xmlString)
  const contexts = createDirectRoundTripContexts()
  const imported = testMetadataItemFromXMLToYAML({
    rule: HomePageWorkAreaRules,
    xml: referenceXML,
    context: contexts.importContext,
  }).yaml as HomePageWorkAreaYAML
  mutate?.(imported)
  return normalizeXML(
    serializeDirectXML(
      testMetadataItemFromYAMLToXML({
        rule: HomePageWorkAreaRules,
        yaml: imported,
        referenceXML,
        context: contexts.exportContext(),
      }).xml
    )
  )
}

describe("HomePageWorkArea YAML → XML", () => {
  it("accepts short role names in item visibility", () => {
    const result = exportYAML(yaml)
    expect(result).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
    expect(result).toContain('<xr:Value name="Role.ПолныеПрава">true</xr:Value>')
  })

  it("rejects prefixed role names in item visibility", () => {
    expect(() =>
      exportYAML({
        ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
        ЛеваяКолонка: [{ Форма: "CommonForm.НачалоРаботы", Видимость: { Роли: { "Role.Администратор": "Ложь" } } }],
      })
    ).toThrow('Неизвестный корень "Role"')
  })

  it("passes unknown enum values through unchanged", () => {
    const result = exportYAML({
      ШаблонРабочейОбласти: "FutureTemplate",
      ОтображениеКомандногоИнтерфейса: "FutureDisplay",
    })
    expect(result).toContain("<WorkingAreaTemplate>FutureTemplate</WorkingAreaTemplate>")
    expect(result).toContain("<MACommandInterfaceDisplays>FutureDisplay</MACommandInterfaceDisplays>")
  })

  it("round-trips compact XML", () => {
    expect(roundTrip(HOME_PAGE_WORK_AREA_XML)).toBe(normalizeXML(HOME_PAGE_WORK_AREA_XML))
  })

  it("writes full role names after YAML import", () => {
    expect(exportYAML(yaml)).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
  })

  it("exports working area template before columns without reference XML", () => {
    const result = exportYAML(yaml)
    expect(result.indexOf("<WorkingAreaTemplate>")).toBeLessThan(result.indexOf("<LeftColumn>"))
  })

  it("preserves unknown item and visibility XML details through YAML round-trip", () => {
    const xml = HOME_PAGE_WORK_AREA_XML.replace(
      "<Item>",
      '<Item customAttribute="keep">'
    )
      .replace("<Visibility>", '<Visibility customVisibility="keep">')
      .replace(
        '<xr:Value name="Role.Администратор">false</xr:Value>',
        '<xr:Value name="Role.Администратор" customRole="keep"><Extra>role</Extra>false</xr:Value><UnknownVisibility>keep visibility</UnknownVisibility>'
      )
      .replace("</Visibility>", "</Visibility><UnknownItemChild>keep item</UnknownItemChild>")
    const result = roundTrip(xml, (value) => {
      value.ЛеваяКолонка![0].Высота = 10
      value.ЛеваяКолонка![0].Видимость!.Роли!.Администратор = "Истина"
    })

    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownItemChild>keep item</UnknownItemChild>")
    expect(result).toContain('customVisibility="keep"')
    expect(result).toContain("<UnknownVisibility>keep visibility</UnknownVisibility>")
    expect(result).toContain('customRole="keep"')
    expect(result).toContain("<Extra>role</Extra>")
    expect(result).toContain("<Height>10</Height>")
    expect(result).toContain("true")
  })

  it("preserves reference Column kind when YAML does not force another kind", () => {
    const xml = HOME_PAGE_WORK_AREA_XML.replace("TwoColumnsVariableWidth", "OneColumn")
      .replace(/<LeftColumn>[\s\S]*?<\/LeftColumn>/, `<Column>
		<Item>
			<Form>CommonForm.НачалоРаботы</Form>
			<Height>100</Height>
		</Item>
	</Column>`)
      .replace(/\n\t<RightColumn>[\s\S]*?<\/RightColumn>/, "")
    const result = roundTrip(xml, (value) => {
      value.Колонка![0].Высота = 10
    })

    expect(result).toContain("<Column>")
    expect(result).not.toContain("<LeftColumn>")
    expect(result).toContain("<Height>10</Height>")
  })
})
