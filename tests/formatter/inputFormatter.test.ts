import "reflect-metadata"
import { expect, describe, beforeEach, it } from "vitest"
import { InputFormatter } from "@/formatter/inputFormatter"
import { IInputFieldElement } from "@/meta/forms/interfaces"
import { IFormatterParams, WrapInGroupStrategy } from "@/formatter/interfaces"
import { container } from "tsyringe"
import { IInputFieldElementToken } from "@/meta/forms/container/symbols"
import { ContainerFactory } from "@/meta/forms/container/containerFactory"
import "../../src/meta"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

describe("InputFormatter", () => {
  let formatter: InputFormatter
  let element: IInputFieldElement

  beforeEach(() => {
    container.clearInstances()
    ContainerFactory.create()

    element = container.resolve<IInputFieldElement>(IInputFieldElementToken)

    formatter = new InputFormatter({ canFormat: () => true } as any, { format: (result: string[]) => result } as any)
  })

  it("should format simple input field", () => {
    element.properties.title = "Поле"
    element.value = "Значение"

    const result = formatter.format(element, mockParams)

    expect(result).toEqual(["Поле: Значение"])
  })
})
