import { expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import App from "./app"

const originalContent = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data/composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data/composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data/composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
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

const response = ["Наименование: {ПолноеНаименование}"]

it("should receive request to parse xml form and send response", async () => {
  const postMessageSpy = vi.spyOn(window, "postMessage")

  // Инициализируем компонент App
  render(<App />)

  // Ждем, пока компонент инициализируется
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Симулируем получение сообщения от VS Code расширения
  window.postMessage({ type: "parse-xml-form", payload: { xml: originalContent } }, "*")

  // Ждем обработки сообщения
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Проверяем, что был отправлен ответ с отформатированным контентом
  expect(postMessageSpy).toHaveBeenCalledWith({ type: "parse-xml-form-response", payload: { content: response } }, "*")
})

it("should receive change text request and update form", async () => {
  // const postMessageSpy = vi.spyOn(window, "postMessage")

  // Инициализируем компонент App
  render(<App />)

  // Ждем, пока компонент инициализируется
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Симулируем получение сообщения от VS Code расширения
  window.postMessage({ type: "change-text", payload: { text: "Поле: Значение {Поле}" } }, "*")

  // Ждем обработки сообщения
  await new Promise((resolve) => setTimeout(resolve, 100))
})
