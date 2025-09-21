import "reflect-metadata"
import "../../src/meta"
import { TYPES } from "@/meta/forms/container/symbols"
import { container } from "tsyringe"
import { IClientApplicationForm } from "@/meta/forms/elements/clientApplicationForm/interfaces"
import { IFormatter } from "@/meta/forms/interfaces"
import { expect, it } from "vitest"
import { IInputField } from "@/elements/interfaces"

it("should render form header", () => {
  const form = container.resolve<IClientApplicationForm>(TYPES.IClientApplicationForm)
  form.properties.title = "Заголовок формы"

  const formatter = container.resolve<IFormatter>(TYPES.IClientApplicationFormFormatter)
  const result = formatter.render(form, {})

  expect(result).toEqual(["--- Заголовок формы ---"])
})

it("should render form properties", () => {
  const form = container.resolve<IClientApplicationForm>(TYPES.IClientApplicationForm)
  form.properties.autoTitle = false

  const formatter = container.resolve<IFormatter>(TYPES.IClientApplicationFormFormatter)
  const result = formatter.render(form, {})

  const mock = `--- Свойства формы ---
Автозаголовок: Ложь
`

  expect(result.join("\n")).toEqual(mock)
})

it("should render element properties", () => {
  const form = container.resolve<IClientApplicationForm>(TYPES.IClientApplicationForm)

  const element = container.resolve<IInputField>(TYPES.IInputField)
  form.items.push(element)

  element.properties.name = "Поле ввода"
  element.properties.inputHint = "Подсказка"

  const formatter = container.resolve<IFormatter>(TYPES.IClientApplicationFormFormatter)
  const result = formatter.render(form, {})

  const mock = `Поле ввода:
--- Свойства ---
ПолеВвода:
  ПодсказкаВвода: Подсказка
`

  expect(result.join("\n")).toEqual(mock)
})
