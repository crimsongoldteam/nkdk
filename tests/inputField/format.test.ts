import { expect, describe, beforeEach, it } from "vitest"
import { container } from "tsyringe"
import { IFormatter, IFormatterParams, WrapInGroupStrategy } from "@/metadata/forms/interfaces"
import { ContainerFactory } from "@/metadata/forms/elements"
import { IInputField } from "@/metadata/forms/elements/inputField/interfaces"
import { DITokens } from "@/symbols"
import { I8nText } from "@/metadata/i8n/i8nText"

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
    element.title = { ru: "Поле" } as I8nText
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
    element.title = { ru: "Поле" } as I8nText
    element.value = "Значение"
    element.height = 2
    element.multiLine = true

    const result = formatter.render(element, mockParams)

    expect(result).toEqual(["Поле: Значение", "      ________"])
  })

  // it("should format input field with modificators", () => {
  //   element.title = { ru: "Поле" } as I8nText
  //   element.value = "Значение"
  //   element.choiceButton = true
  //   element.dropListButton = true
  //   element.clearButton = true
  //   element.openButton = true
  //   element.spinButton = true

  //   const result = formatter.render(element, mockParams)

  //   expect(result).toEqual(["Поле: Значение__ВСХОД"])
  // })
})
