import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { plainToInstance } from "class-transformer"
import {
  InputFieldEnterpriseTransform,
  InputFieldPropertiesEnterpriseTransform,
} from "@/meta/forms/elements/inputField/enterpriseTransform"
import { IInputField, IInputFieldProperties } from "@/meta/forms/elements/inputField/interfaces"
import { TYPES } from "@/meta/forms/container/symbols"

const mockInput = {
  Тип: "ПолеФормы",
  НаборСвойств: {
    Вид: "ПолеВвода",
    Заголовок: "Поле",
  },
  Значение: "Значение",
}

const mockInputProperties = {
  Вид: "ПолеВвода",
  Заголовок: "Поле",
}

beforeEach(() => {
  container.clearInstances()
  ContainerFactory.create()
})

it("should import from Enterprise", () => {
  const transform = plainToInstance(InputFieldEnterpriseTransform, mockInput, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  })

  const input = container.resolve<IInputField>(TYPES.IInputField)
  transform.export(input)

  expect(input.properties.title).toEqual("Поле")
  expect(input.properties.type).toEqual("ПолеВвода")
  expect(input.value).toEqual("Значение")
})

it("should import properties from Enterprise", () => {
  const transform = plainToInstance(InputFieldPropertiesEnterpriseTransform, mockInputProperties, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  })

  const properties = container.resolve<IInputFieldProperties>(TYPES.IInputFieldProperties)
  transform.export(properties)

  expect(properties.title).toEqual("Поле")
  expect(properties.type).toEqual("ПолеВвода")
})
