import { expect, it } from "vitest"
import xmlImport from "./importer"
import importClientApplicationFormFromXML from "~/lib/metadata/forms/elements/сlientApplicationForm/importFromXML"
import { ZClientApplicationFormXML } from "~/lib/metadata/forms/elements/сlientApplicationForm/types"
import { formatClientApplicationForm } from "~/lib/metadata/forms/elements/сlientApplicationForm/format"

// describe("xmlImport", () => {
//   const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
// <Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
// 	<ChildItems>
// 		<InputField>
// 		</InputField>
// 	</ChildItems>
// </Form>`

//   const mockResult = {
//     Form: {
//       ChildItems: [
//         {
//           InputField: {},
//         },
//       ],
//     },
//   }

//   it("should parse form with child items", () => {
//     const result = xmlImport<any>(mockXml)

//     expect(result).toEqual(mockResult)
//   })
// })

it("should import form with child items", () => {
  const originalContent = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<ChildItems>
		<InputField name="ПолноеНаименование" id="16">
			<Title>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Наименование</v8:content>
				</v8:item>
			</Title>
		</InputField>
	</ChildItems>
</Form>`
  const xmlData = xmlImport(originalContent)
  const xmlFormData = (xmlData as any).Form
  const xmlForm = ZClientApplicationFormXML.parse(xmlFormData)
  const form = importClientApplicationFormFromXML(xmlForm)
  const formattedContent = formatClientApplicationForm(form, {})
  expect(formattedContent).toEqual(["Наименование: "])
})
