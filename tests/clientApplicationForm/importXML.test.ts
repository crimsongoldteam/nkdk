import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import { ContainerFactory } from "@/metadata/forms/elements"
import { XMLImporter } from "@/xml/importer"
import { IClientApplicationForm } from "@/metadata/forms/elements/сlientApplicationForm/interfaces"
import { container } from "tsyringe"
import { DITokens } from "@/symbols"

const mockForm = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
    <Title>Форма</Title>
	<ChildItems>
    </ChildItems>
</Form>`

const mockFormWithChildItems = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
    <Title>Форма</Title>
	<ChildItems>
		<InputField name="1">
			<Title>Input field</Title>
		</InputField> 
       
		<InputField name="3">
			<Title>Input field</Title>
		</InputField>       
	</ChildItems>
</Form>`

beforeEach(() => {
  new ContainerFactory().register()
})

// it("should import from XML", () => {
//   const form = container
//     .resolve(XMLImporter)
//     .import<IClientApplicationForm>(mockForm, DITokens.ClientApplicationForm.XMLImportRules)

//   expect(form.title).toEqual("Форма")
// })

it("should import from XML with child items", () => {
  const form = container
    .resolve(XMLImporter)
    .import<IClientApplicationForm>(mockFormWithChildItems, DITokens.ClientApplicationForm.XMLImportRules)

  expect(form.items).toHaveLength(2)
  expect((form.items[0] as any).title).toEqual("Input field")
  expect((form.items[1] as any).title).toEqual("Input field")
})
