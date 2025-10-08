import { expect, it, vi } from "vitest"
import xmlImport from "~/lib/xml/import/importer"
import { TClientApplicationFormXML } from "~/lib/metadata/forms/elements/сlientApplicationForm/types"
import { formatClientApplicationForm } from "~/lib/metadata/forms/elements/сlientApplicationForm/format"
import { exportClientApplicationFormToXML, importClientApplicationFormFromXML, xmlExport } from "~/lib"
import { parseText } from "~/lib/parser"
import { createNameIdMapping, updateNameIdMapping } from "~/lib/xml/import/nameIdMapping"

const originalContent = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItems>
		<InputField name="Фамилия" id="1">
			<DataPath>Фамилия</DataPath>
		</InputField>
		<InputField name="Имя" id="4">
			<DataPath>Имя</DataPath>
		</InputField>
	</ChildItems>
</Form>`

it("should took xml and return itself", async () => {
  const importedXml = xmlImport<TClientApplicationFormXML>(originalContent)
  const form = importClientApplicationFormFromXML(importedXml)

  const nameMapping = createNameIdMapping(form)

  const formattedContent = formatClientApplicationForm(form, {})

  const formFormatted = parseText(formattedContent.join("\n"))

  updateNameIdMapping(nameMapping, formFormatted)

  const exportedXml = exportClientApplicationFormToXML(formFormatted)
  const resultedContent = xmlExport(exportedXml)

  expect(resultedContent).toEqual(originalContent)
})

// const response = ["Наименование: {ПолноеНаименование}"]

// it("should receive request to parse xml form and send response", async () => {
//   const postMessageSpy = vi.spyOn(window, "postMessage")

//   // Инициализируем компонент App
//   render(<App />)

//   // Ждем, пока компонент инициализируется
//   await new Promise((resolve) => setTimeout(resolve, 100))

//   // Симулируем получение сообщения от VS Code расширения
//   window.postMessage({ type: "parse-xml-form", payload: { xml: originalContent } }, "*")

//   // Ждем обработки сообщения
//   await new Promise((resolve) => setTimeout(resolve, 100))

//   // Проверяем, что был отправлен ответ с отформатированным контентом
//   expect(postMessageSpy).toHaveBeenCalledWith({ type: "parse-xml-form-response", payload: { content: response } }, "*")
// })

// it("should receive change text request and update form", async () => {
//   // const postMessageSpy = vi.spyOn(window, "postMessage")

//   // Инициализируем компонент App
//   render(<App />)

//   // Ждем, пока компонент инициализируется
//   await new Promise((resolve) => setTimeout(resolve, 100))

//   // Симулируем получение сообщения от VS Code расширения
//   window.postMessage({ type: "change-text", payload: { text: "Поле: Значение {Поле}" } }, "*")

//   // Ждем обработки сообщения
//   await new Promise((resolve) => setTimeout(resolve, 100))
// })
