import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { plainToInstance } from "class-transformer"
import { XMLParser } from "fast-xml-parser"
import { InputFieldXMLTransform } from "../../src/meta"
import { TYPES } from "@/meta/forms/container/symbols"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"

const mockInput = `<InputField name="ИмяПоля">
  <Title>Поле</Title>
</InputField>`

beforeEach(() => {
  container.clearInstances()
  ContainerFactory.create()
})

it("should import from XML", () => {
  const parser = new XMLParser({ ignoreAttributes: false })
  const xmlData = parser.parse(mockInput)

  const transform = plainToInstance(InputFieldXMLTransform, xmlData.InputField, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  })

  const input = container.resolve<IInputField>(TYPES.IInputField)
  transform.import(input)

  expect(input.properties.title).toEqual("Поле")
  expect(input.properties.type).toEqual("ПолеВвода")
  expect(input.properties.name).toEqual("ИмяПоля")
})
