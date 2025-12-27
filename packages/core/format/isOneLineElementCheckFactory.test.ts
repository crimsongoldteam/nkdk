import { describe, it, expect, beforeEach } from "vitest"
import {
  registerIsOneLineElementCheck,
  isOneLineElement,
  clearIsOneLineElementCheckRegistry,
} from "./isOneLineElementCheckFactory"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadata/metadataFactory/types"

describe("isOneLineElementCheckFactory", () => {
  beforeEach(() => {
    clearIsOneLineElementCheckRegistry()
  })

  it("should register and use check function for element type", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "InputField",
      id: "1",
    }

    const checkFunction = (_element: BaseElement) => true
    registerIsOneLineElementCheck(FormElementType.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should clear registry correctly", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "InputField",
      id: "1",
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
      id: "2",
    }

    const group: BaseElement = {
      elementType: FormElementType.UsualGroup,
      name: "UsualGroup",
      id: "1",
    }

    registerIsOneLineElementCheck(FormElementType.InputField, () => true)
    registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
