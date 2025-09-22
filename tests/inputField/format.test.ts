import "reflect-metadata"
import { expect, describe, beforeEach, it } from "vitest"
import { container } from "tsyringe"
import { IFormatter, IFormatterParams, WrapInGroupStrategy } from "@/metadata/forms/interfaces"
import { ContainerFactory } from "@/metadata/forms/elements"
import { IInputField } from "@/metadata/forms/elements/inputField/interfaces"
import { DITokens } from "@/symbols"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

describe("InputFormatter", () => {
  let formatter: IFormatter
  let element: IInputField

  beforeEach(() => {
    container.clearInstances()
    new ContainerFactory().register()

    element = container.resolve<IInputField>(DITokens.InputField.Element)

    formatter = container.resolve(element.formatterToken)
  })

  it("should format input field with title", () => {
    element.properties.title = "Поле"
    element.value = "Значение"

    const result = formatter.render(element, mockParams)

    expect(result).toEqual(["Поле: Значение"])
  })

  it("should format input field without title", () => {
    element.value = "Значение"

    const result = formatter.render(element, mockParams)

    expect(result).toEqual([": Значение"])
  })

  it("should format multiline input field", () => {
    element.properties.title = "Поле"
    element.value = "Значение"
    element.properties.height = 2
    element.properties.multiLine = true

    const result = formatter.render(element, mockParams)

    expect(result).toEqual(["Поле: Значение", "      ________"])
  })

  it("should format input field with modificators", () => {
    element.properties.title = "Поле"
    element.value = "Значение"
    element.properties.choiceButton = true
    element.properties.dropListButton = true
    element.properties.clearButton = true
    element.properties.openButton = true
    element.properties.spinButton = true

    const result = formatter.render(element, mockParams)

    expect(result).toEqual(["Поле: Значение__ВСХОД"])
  })
})
