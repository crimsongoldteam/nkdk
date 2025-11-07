import { describe, expect, it } from "vitest"
import {
  exportClientApplicationFormToXML,
  TClientApplicationForm,
  xmlExport,
  ZClientApplicationFormXML,
} from "~/lib"
import { ZElementType } from "../types"
import "~/lib/metadata/forms/elements/exportToXML"
import z from "zod"

describe("exportClientApplicationFormToXML", () => {
  it("should export title to XML", () => {
    const mockElement: TClientApplicationForm = {
      elementType: ZElementType.enum.ClientApplicationForm,
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: ZElementType.enum.CommandBar,
        childItems: [],
      },
      title: { items: { ru: "Поле" } },
      childItems: [],
      attributes: [],
    }

    const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.18">
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Поле</v8:content>
		</v8:item>
	</Title>
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
</Form>`

    const exported = exportClientApplicationFormToXML(mockElement)
    const xmlString = xmlExport(
      { Form: exported },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export command bar to XML", () => {
    const mockElement: TClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: ZElementType.enum.CommandBar,
        autofill: false,
        childItems: [],
      },
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [],
      attributes: [],
    }

    const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.18">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
		<Autofill>false</Autofill>
	</AutoCommandBar>
</Form>`

    const exported = exportClientApplicationFormToXML(mockElement)
    const xmlString = xmlExport(
      { Form: exported },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export items to XML", () => {
    const mockElement: TClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: ZElementType.enum.CommandBar,
        childItems: [],
      },
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: ZElementType.enum.InputField,
        },
      ],
      attributes: [],
    }

    const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.18">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItems>
		<InputField name="ПолеВвода" id="1"/>
	</ChildItems>
</Form>`

    const exported = exportClientApplicationFormToXML(mockElement)
    const xmlString = xmlExport(
      { Form: exported },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export attributes to XML", () => {
    const mockElement: TClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: ZElementType.enum.CommandBar,
        childItems: [],
      },
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [],
      attributes: [
        {
          name: "Объект",
          id: "1",
          type: { type: ["DataProcessorObject.ТестоваяОбработка"] },
          mainAttribute: true,
        },
      ],
    }

    const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.18">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<Attributes>
		<Attribute name="Объект" id="1">
			<Type>
				<v8:Type>cfg:DataProcessorObject.ТестоваяОбработка</v8:Type>
			</Type>
			<MainAttribute>true</MainAttribute>
		</Attribute>
	</Attributes>
</Form>`

    const exported = exportClientApplicationFormToXML(mockElement)
    const xmlString = xmlExport(
      { Form: exported },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export usual group child items to XML", () => {
    const mockElement: TClientApplicationForm = {
      attributes: [],
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: ZElementType.enum.CommandBar,
        childItems: [],
      },
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [
        {
          name: "Группа",
          id: "1",
          elementType: ZElementType.enum.UsualGroup,
          childItems: [
            {
              name: "ПолеВвода",
              id: "1",
              elementType: ZElementType.enum.InputField,
            },
          ],
        },
      ],
    }

    const expectedResult = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.18">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItems>
		<UsualGroup name="Группа" id="1">
			<ChildItems>
				<InputField name="ПолеВвода" id="1"/>
			</ChildItems>
		</UsualGroup>
	</ChildItems>
</Form>`

    const exported = exportClientApplicationFormToXML(mockElement)
    const xmlString = xmlExport(
      { Form: exported },
      z.object({ Form: ZClientApplicationFormXML })
    )

    expect(xmlString).toEqual(expectedResult)
  })
})
