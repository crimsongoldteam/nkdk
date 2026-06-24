import { describe, expect, it } from "vitest"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { mockContext, mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { HomePageWorkAreaRules } from "./rules"
import type { HomePageWorkAreaYAML } from "./types"

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

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").trimEnd()

const roundTripHomePageWorkArea = (xmlString: string): string => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: HomePageWorkAreaRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: HomePageWorkAreaRules,
    xmlString,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    rule: HomePageWorkAreaRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

const roundTripHomePageWorkAreaThroughYAML = (
  xmlString: string,
  mutateYAML?: (yaml: NonNullable<HomePageWorkAreaYAML>) => void
): string => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: HomePageWorkAreaRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: HomePageWorkAreaRules,
    xmlString,
  })
  const yaml = exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: HomePageWorkAreaRules,
  })
  expect(yaml).toBeDefined()
  mutateYAML?.(yaml!)
  const dataFromYAML = importMetadataItemFromYAML({
    context: mockContext,
    rule: HomePageWorkAreaRules,
    yaml,
    source: referenceData,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data: dataFromYAML,
    rule: HomePageWorkAreaRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

describe("export HomePageWorkArea to XML", () => {
  it("round-trips compact XML", () => {
    expect(roundTripHomePageWorkArea(HOME_PAGE_WORK_AREA_XML)).toBe(normalizeXML(HOME_PAGE_WORK_AREA_XML))
  })

  it("writes full role names after YAML import", () => {
    const data = importMetadataItemFromYAML({
      context: mockContext,
      rule: HomePageWorkAreaRules,
      yaml: {
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
        ОтображениеКомандногоИнтерфейса: "Верх",
      },
    })
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data,
      rule: HomePageWorkAreaRules,
    })

    expect(xmlExport(xml!)).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
  })

  it("exports working area template before columns without reference XML", () => {
    const data = importMetadataItemFromYAML({
      context: mockContext,
      rule: HomePageWorkAreaRules,
      yaml: {
        ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
        ЛеваяКолонка: [
          {
            Форма: "CommonForm.НачалоРаботы",
            Высота: 100,
          },
        ],
      },
    })
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data,
      rule: HomePageWorkAreaRules,
    })

    const result = xmlExport(xml!)
    expect(result.indexOf("<WorkingAreaTemplate>")).toBeLessThan(result.indexOf("<LeftColumn>"))
  })

  it("preserves unknown item and visibility XML details through YAML round-trip", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<HomePageWorkArea xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<WorkingAreaTemplate>TwoColumnsVariableWidth</WorkingAreaTemplate>
\t<LeftColumn>
\t\t<Item customAttribute="keep">
\t\t\t<Form>CommonForm.НачалоРаботы</Form>
\t\t\t<Height>100</Height>
\t\t\t<Visibility customVisibility="keep">
\t\t\t\t<xr:Common>true</xr:Common>
\t\t\t\t<xr:Value name="Role.Администратор" customRole="keep"><Extra>role</Extra>false</xr:Value>
\t\t\t\t<UnknownVisibility>keep visibility</UnknownVisibility>
\t\t\t</Visibility>
\t\t\t<UnknownItemChild>keep item</UnknownItemChild>
\t\t</Item>
\t</LeftColumn>
</HomePageWorkArea>`

    const result = roundTripHomePageWorkAreaThroughYAML(xmlString, (yaml) => {
      yaml.ЛеваяКолонка![0].Высота = 10
      yaml.ЛеваяКолонка![0].Видимость!.Роли!.Администратор = "Истина"
    })

    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownItemChild>keep item</UnknownItemChild>")
    expect(result).toContain('customVisibility="keep"')
    expect(result).toContain("<UnknownVisibility>keep visibility</UnknownVisibility>")
    expect(result).toContain('<xr:Value customRole="keep" name="Role.Администратор">')
    expect(result).toContain("<Extra>role</Extra>")
    expect(result).toContain("<Height>10</Height>")
    expect(result).toContain("true")
  })

  it("preserves reference Column kind when YAML does not force another kind", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<HomePageWorkArea xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<WorkingAreaTemplate>OneColumn</WorkingAreaTemplate>
\t<Column>
\t\t<Item>
\t\t\t<Form>CommonForm.НачалоРаботы</Form>
\t\t\t<Height>100</Height>
\t\t</Item>
\t</Column>
</HomePageWorkArea>`

    const result = roundTripHomePageWorkAreaThroughYAML(xmlString, (yaml) => {
      yaml.Колонка![0].Высота = 10
    })

    expect(result).toContain("<Column>")
    expect(result).not.toContain("<LeftColumn>")
    expect(result).toContain("<Height>10</Height>")
  })
})
