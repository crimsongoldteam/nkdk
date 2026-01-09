import { beforeEach, describe, expect, it } from "vitest"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadata/metadataFactory/types"
import {
  clearIsOneLineElementCheckRegistry,
  isOneLineElement,
  registerIsOneLineElementCheck,
} from "./isOneLineElementCheckFactory"

describe("isOneLineElementCheckFactory", () => {
  beforeEach(() => {
    clearIsOneLineElementCheckRegistry()
  })

  it("should register and use check function for element type", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = (_element: BaseElement) => true
    registerIsOneLineElementCheck(FormElementType.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should clear registry correctly", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck(FormElementType.InputField, checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: BaseElement = {
      elementType: FormElementType.InputField,
      name: "InputField",
    }

    const group: BaseElement = {
      elementType: FormElementType.UsualGroup,
      name: "UsualGroup",
    }

    registerIsOneLineElementCheck(FormElementType.InputField, () => true)
    registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
