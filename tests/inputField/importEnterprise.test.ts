import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { plainToInstance } from "class-transformer"
import { InputFieldEnterpriseTransform } from "@/meta/forms/elements/inputField/enterpriseTransformer"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"
import { TYPES } from "@/meta/forms/container/symbols"

const mockInput = {
  Тип: "ПолеФормы",
  НаборСвойств: {
    Вид: "ПолеВвода",
    Заголовок: "Поле",
  },
  Значение: "Значение",
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
  transform.fillElement(input)

  expect(input.properties.title).toEqual("Поле")
  expect(input.properties.type).toEqual("ПолеВвода")
  expect(input.value).toEqual("Значение")
})
