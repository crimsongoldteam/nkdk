import { expect, it } from "vitest"
import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import importClientApplicationFormFromXML from "./importFromXML"
import { xmlImport } from "~/lib"
import { ZElementType } from "../types"

it("should import title from XML", () => {
  const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Поле</v8:content>
		</v8:item>
	</Title>
	<ChildItems></ChildItems>
</Form>`

  const mockElement: TClientApplicationForm = {
    type: ZElementType.enum.Form,
    autoCommandBar: {
      id: "-1",
      name: "ФормаКоманднаяПанель",
    },
    title: { ru: "Поле" },
    items: [],
    attributes: [],
  }

  const xmlData = xmlImport<TClientApplicationFormXML>(mockXml)
  const element = importClientApplicationFormFromXML(xmlData)

  expect(element).toEqual(mockElement)
})

it("should import items from XML", () => {
  const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItems>
		<InputField name="ПолеВвода" id="1"/>
	</ChildItems>
</Form>`

  const mockElement: TClientApplicationForm = {
    autoCommandBar: {
      id: "-1",
      name: "ФормаКоманднаяПанель",
    },
    type: ZElementType.enum.Form,
    items: [{ name: "ПолеВвода", id: "1", type: ZElementType.enum.InputField }],
    attributes: [],
  }

  const xmlData = xmlImport<TClientApplicationFormXML>(mockXml)
  const form = importClientApplicationFormFromXML(xmlData)

  expect(form).toEqual(mockElement)
})

it("should import attributes from XML", () => {
  const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItems></ChildItems>
	<Attributes>
		<Attribute name="Объект" id="1">
			<Type>
				<v8:Type>cfg:DataProcessorObject.ТестоваяОбработка</v8:Type>
			</Type>
			<MainAttribute>true</MainAttribute>
		</Attribute>
  </Attributes>
</Form>`

  const mockElement: TClientApplicationForm = {
    autoCommandBar: {
      id: "-1",
      name: "ФормаКоманднаяПанель",
    },
    type: ZElementType.enum.Form,
    items: [],
    attributes: [
      {
        name: "Объект",
        id: "1",
        type: { type: ["DataProcessorObject.ТестоваяОбработка"] },
        mainAttribute: true,
      },
    ],
  }

  const xmlData = xmlImport<TClientApplicationFormXML>(mockXml)

  const form = importClientApplicationFormFromXML(xmlData)

  expect(form).toEqual(mockElement)
})
