import { describe, expect, it } from "vitest"

import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import { HomePageWorkAreaRules } from "./rules"

import "./register"

export const HOME_PAGE_WORK_AREA_XML = `<?xml version="1.0" encoding="UTF-8"?>
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

const expectedYAML = {
  ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
  ЛеваяКолонка: [
    {
      Форма: "CommonForm.НачалоРаботы",
      Высота: 100,
      Видимость: { Общее: "Истина", Роли: { Администратор: "Ложь" } },
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

const convert = (xml = HOME_PAGE_WORK_AREA_XML) =>
  testMetadataItemFromXMLToYAML({
    rule: HomePageWorkAreaRules,
    xml: importContentFromXML(xml),
  }).yaml

describe("HomePageWorkArea XML → YAML", () => {
  it("imports working area template, columns, items and visibility", () => {
    expect(convert()).toEqual(expectedYAML)
  })

  it("exports columns, item visibility and enum values", () => {
    expect(convert()).toEqual(expectedYAML)
  })

  it("passes unknown enum values through unchanged", () => {
    const xml = HOME_PAGE_WORK_AREA_XML.replace("TwoColumnsVariableWidth", "FutureTemplate").replace(
      "Top",
      "FutureDisplay"
    )

    expect(convert(xml)).toMatchObject({
      ШаблонРабочейОбласти: "FutureTemplate",
      ОтображениеКомандногоИнтерфейса: "FutureDisplay",
    })
  })
})
