import { expect, it } from "vitest"
import { TClientApplicationForm, TClientApplicationFormXML } from "./types"
import xmlExport from "~/lib/xml/export/exporter"
import exportClientApplicationFormToXML from "./exportToXML"

const mockElement: TClientApplicationForm = {
  items: [{ name: "ИмяПоля", id: "1" }],
}

const mockXml: TClientApplicationFormXML = {
  Form: {
    _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
    "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
    "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
    "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
    "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.20",
    ChildItems: [
      {
        InputField: {
          _name: "ИмяПоля",
          _id: "1",
        },
      },
    ],
  },
}

const mockXmlString = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <ChildItems>
    <InputField name="ИмяПоля" id="1"></InputField>
  </ChildItems>
</Form>`

it("should export to XML-structure", () => {
  const input = exportClientApplicationFormToXML(mockElement)

  expect(input).toEqual(mockXml)
})

it("should export to XML-string", () => {
  const xml = xmlExport<TClientApplicationFormXML>(mockXml)

  expect(xml).toEqual(mockXmlString)
})
