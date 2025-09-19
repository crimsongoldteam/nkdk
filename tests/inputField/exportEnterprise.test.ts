import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { TYPES } from "@/meta/forms/container/symbols"
import { IEnterpriseTransform } from "@/meta/forms/interfaces"
import { instanceToPlain } from "class-transformer"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"

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

it("should export to Enterprise", () => {
  const input = container.resolve<IInputField>(TYPES.IInputField)
  input.properties.title = "Поле"
  input.value = "Значение"

  const transform = container.resolve<IEnterpriseTransform>(TYPES.InputFieldEnterpriseTransform)
  transform.fillTransform(input)

  const result = instanceToPlain(transform, {
    strategy: "excludeAll",
    exposeUnsetFields: false,
  })

  expect(result).toEqual(mockInput)
})
