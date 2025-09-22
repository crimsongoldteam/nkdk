import "reflect-metadata"
import { it, expect, beforeEach } from "vitest"
import { ContainerFactory } from "@/metadata/forms/elements"
import { IInputField } from "@/metadata/forms/elements/inputField/interfaces"
import { container } from "tsyringe"
import { DITokens } from "@/symbols"
import { XMLExporter } from "@/xml/exporter"

beforeEach(() => {
  new ContainerFactory().register()
})

it("should export to XML", () => {
  const input = container.resolve<IInputField>(DITokens.InputField.Element)
  input.properties.title = { ru: "Поле" }
  input.properties.name = "ИмяПоля"

  const result = container.resolve(XMLExporter).export(input)

  const xml = `<InputField name="ИмяПоля">
  <Title>
    <v8:item>
      <v8:lang>ru</v8:lang>
      <v8:content>Поле</v8:content>
    </v8:item>
  </Title>
</InputField>`

  expect(result.trim()).toEqual(xml.trim())
})
