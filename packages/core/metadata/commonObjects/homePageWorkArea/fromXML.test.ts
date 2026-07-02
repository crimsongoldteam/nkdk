import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { HomePageWorkAreaRules } from "./rules"

import "./register"

export const HOME_PAGE_WORK_AREA_XML = `<?xml version="1.0" encoding="UTF-8"?>
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

describe("import HomePageWorkArea from XML", () => {
  it("imports working area template, columns, items and visibility", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: HomePageWorkAreaRules,
      xmlString: HOME_PAGE_WORK_AREA_XML,
    })

    expect(result).toMatchObject({
      itemType: "HomePageWorkArea",
      workingAreaTemplate: "TwoColumnsVariableWidth",
      leftColumn: [
        {
          form: "CommonForm.НачалоРаботы",
          height: 100,
          visibility: {
            common: true,
            roles: {
              "Role.Администратор": false,
            },
          },
        },
      ],
      rightColumn: [
        {
          form: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
          height: 10,
          visibility: {
            common: false,
          },
        },
      ],
      maCommandInterfaceDisplays: "Top",
    })
  })
})
