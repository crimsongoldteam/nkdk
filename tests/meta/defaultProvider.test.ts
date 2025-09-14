import { it, expect, beforeEach } from "vitest"
import "reflect-metadata"
import { container } from "tsyringe"
import { TYPES } from "../../src/meta/forms/container/symbols"
import { IInputField } from "@/meta/forms/interfaces"
import { IDefaultsProvider } from "@/meta/forms/helpers/interfaces"
import "../../src/meta"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"

let provider: IDefaultsProvider

beforeEach(() => {
  container.clearInstances()
  ContainerFactory.create()

  provider = container.resolve<IDefaultsProvider>(TYPES.IInputFieldDefaultsProvider)
})

it("should render element", () => {
  const element = container.resolve<IInputField>(TYPES.IInputField)
  element.properties.title = "Test"
  const result = provider.render(element)
  expect(result).toEqual({ title: "Test" })
})
