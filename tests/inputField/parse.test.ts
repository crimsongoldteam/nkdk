import { CSTGenerator } from "@/editor/cstGenerator"
import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import { container } from "tsyringe"
import { IInputField } from "@/meta/forms/elements/inputField/interfaces"

beforeEach(() => {
  container.clearInstances()
  ContainerFactory.create()
})

it("should parse input field", () => {
  const text = "Поле:Значение"

  const buildResult = CSTGenerator.build(text, "parseForm")
  const result = buildResult.element.items[0] as IInputField

  expect(result.properties.title).toEqual("Поле")
  expect(result.value).toEqual("Значение")
})

it("should parse multiline input field", () => {
  const text = `
Поле:Значение
___
___`

  const buildResult = CSTGenerator.build(text, "parseForm")
  const result = buildResult.element.items[0] as IInputField

  expect(result.properties.title).toEqual("Поле")
  expect(result.value).toEqual("Значение")
  expect(result.properties.multiLine).toBeTruthy()
  expect(result.properties.height).toEqual(3)
})

it("should parse input field with properties", () => {
  const text = "Поле:Значение {ПодсказкаВвода = ТекстПодсказки}"

  const buildResult = CSTGenerator.build(text, "parseForm")
  const result = buildResult.element.items[0] as IInputField

  expect(result.properties.inputHint).toEqual("ТекстПодсказки")
})
