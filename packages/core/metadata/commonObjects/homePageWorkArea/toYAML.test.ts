import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContext, mockContextFromXML } from "~/tests/mockContext"
import { HomePageWorkAreaRules } from "./rules"

import "./register"

const HOME_PAGE_WORK_AREA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HomePageWorkArea xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<WorkingAreaTemplate>TwoColumnsVariableWidth</WorkingAreaTemplate>
\t<LeftColumn>
\t\t<Item>
\t\t\t<Form>CommonForm.НачалоРаботы</Form>
\t\t\t<Height>100</Height>
\t\t\t<Visibility>
\t\t\t\t<xr:Common>true</xr:Common>
\t\t\t\t<xr:Value name="Role.Администратор">false</xr:Value>
\t\t\t</Visibility>
\t\t</Item>
\t</LeftColumn>
\t<RightColumn>
\t\t<Item>
\t\t\t<Form>DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр</Form>
\t\t\t<Height>10</Height>
\t\t\t<Visibility>
\t\t\t\t<xr:Common>false</xr:Common>
\t\t\t</Visibility>
\t\t</Item>
\t</RightColumn>
\t<MACommandInterfaceDisplays>Top</MACommandInterfaceDisplays>
</HomePageWorkArea>`

const exportHomePageWorkAreaToYAML = (xmlString: string) => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: HomePageWorkAreaRules,
    xmlString,
  })

  return exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: HomePageWorkAreaRules,
  })
}

describe("export HomePageWorkArea to YAML", () => {
  it("exports columns, item visibility and enum values", () => {
    expect(exportHomePageWorkAreaToYAML(HOME_PAGE_WORK_AREA_XML)).toEqual({
      ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
      ЛеваяКолонка: [
        {
          Форма: "CommonForm.НачалоРаботы",
          Высота: 100,
          Видимость: {
            Общее: "Истина",
            Роли: {
              Администратор: "Ложь",
            },
          },
        },
      ],
      ПраваяКолонка: [
        {
          Форма: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
          Высота: 10,
          Видимость: {
            Общее: "Ложь",
          },
        },
      ],
      ОтображениеКомандногоИнтерфейса: "Верх",
    })
  })

  it("passes unknown enum values through unchanged", () => {
    const xmlString = HOME_PAGE_WORK_AREA_XML.replace("TwoColumnsVariableWidth", "FutureTemplate").replace(
      "Top",
      "FutureDisplay"
    )

    expect(exportHomePageWorkAreaToYAML(xmlString)).toMatchObject({
      ШаблонРабочейОбласти: "FutureTemplate",
      ОтображениеКомандногоИнтерфейса: "FutureDisplay",
    })
  })
})
