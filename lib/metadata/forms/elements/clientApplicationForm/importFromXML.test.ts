import { describe, expect, it } from "vitest"
import { ClientApplicationForm, ClientApplicationFormXML, importClientApplicationFormFromXML, xmlImport } from "~/lib"
import "~/lib/metadata/forms/elements/importFromXML"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../../../metadataFactory/types"

describe("importClientApplicationFormFromXML", () => {
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

    const mockElement: ClientApplicationForm = {
      elementType: FormElementType.ClientApplicationForm,
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: FormElementType.CommandBar,
        childItems: [],
      },
      title: { items: { ru: "Поле" } },
      childItems: [],
      attributes: [],
    }

    const xmlData = xmlImport<{ Form: ClientApplicationFormXML }>(mockXml)
    const element = importClientApplicationFormFromXML(mockConfigurationSettings, xmlData.Form)

    expect(element).toEqual(mockElement)
  })

  it("should import command bar from XML", () => {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
      <AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
        <Autofill>false</Autofill>
      </AutoCommandBar>
    </Form>`

    const mockElement: ClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: FormElementType.CommandBar,
        autofill: false,
        childItems: [],
      },

      elementType: FormElementType.ClientApplicationForm,
      childItems: [],
      attributes: [],
    }

    const xmlData = xmlImport<{ Form: ClientApplicationFormXML }>(mockXml)
    const element = importClientApplicationFormFromXML(mockConfigurationSettings, xmlData.Form)

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

    const mockElement: ClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: FormElementType.CommandBar,
        childItems: [],
      },
      elementType: FormElementType.ClientApplicationForm,
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: FormElementType.InputField,
        },
      ],
      attributes: [],
    }

    const xmlData = xmlImport<{ Form: ClientApplicationFormXML }>(mockXml)
    const form = importClientApplicationFormFromXML(mockConfigurationSettings, xmlData.Form)

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

    const mockElement: ClientApplicationForm = {
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: FormElementType.CommandBar,
        childItems: [],
      },
      elementType: FormElementType.ClientApplicationForm,
      childItems: [],
      attributes: [
        {
          name: "Объект",
          id: "1",
          valueType: { type: ["DataProcessorObject.ТестоваяОбработка"] },
          mainAttribute: true,
        },
      ],
    }

    const xmlData = xmlImport<{ Form: ClientApplicationFormXML }>(mockXml)

    const form = importClientApplicationFormFromXML(mockConfigurationSettings, xmlData.Form)

    expect(form).toEqual(mockElement)
  })

  it("should import usual group child items from XML", () => {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
      <AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
      <ChildItems>
        <UsualGroup name="Группа" id="1">
          <ChildItems>
            <InputField name="ПолеВвода" id="1"/>
          </ChildItems>
        </UsualGroup>
      </ChildItems>
    </Form>`

    const mockElement: ClientApplicationForm = {
      attributes: [],
      autoCommandBar: {
        id: "-1",
        name: "ФормаКоманднаяПанель",
        elementType: FormElementType.CommandBar,
        childItems: [],
      },
      elementType: FormElementType.ClientApplicationForm,
      childItems: [
        {
          name: "Группа",
          id: "1",
          elementType: FormElementType.UsualGroup,
          childItems: [
            {
              name: "ПолеВвода",
              id: "1",
              elementType: FormElementType.InputField,
            },
          ],
        },
      ],
    }

    const xmlData = xmlImport<{ Form: ClientApplicationFormXML }>(mockXml)

    const form = importClientApplicationFormFromXML(mockConfigurationSettings, xmlData.Form)

    expect(form).toEqual(mockElement)
  })
})
