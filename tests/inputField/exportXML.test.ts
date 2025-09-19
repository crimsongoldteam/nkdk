import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { TYPES } from "@/meta/forms/container/symbols"
import { IXMLTransform } from "@/meta/forms/interfaces"
import { instanceToPlain } from "class-transformer"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"
import { XMLBuilder } from "fast-xml-parser"

beforeEach(() => {
  container.clearInstances()
  ContainerFactory.create()
})

it("should export to XML", () => {
  const input = container.resolve<IInputField>(TYPES.IInputField)
  input.properties.title = "Поле"
  input.value = "Значение"

  const transform = container.resolve<IXMLTransform>(TYPES.InputFieldXMLTransform)
  transform.fillTransform(input)

  const result = {
    InputField: instanceToPlain(transform, {
      strategy: "excludeAll",
      exposeUnsetFields: false,
    }),
  }

  const builder = new XMLBuilder({ format: true })
  const xmlContent = builder.build(result)

  const xml = `<InputField>
  <Title>Поле</Title>
</InputField>`

  expect(xmlContent.trim()).toEqual(xml.trim())
})
