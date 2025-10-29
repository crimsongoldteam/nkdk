import { describe, it, expect, beforeEach } from "vitest"
import {
  registerIsOneLineElementCheck,
  isOneLineElement,
  clearIsOneLineElementCheckRegistry,
} from "./isOneLineElementCheckFactory"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { ElementType } from "../metadata/systemEnumerations/types"

describe("isOneLineElementCheckFactory", () => {
  beforeEach(() => {
    clearIsOneLineElementCheckRegistry()
  })

  it("should register and use check function for element type", () => {
    const element: TBaseElement = {
      type: ElementType.InputField,
    }

    const checkFunction = (_element: TBaseElement) => true
    registerIsOneLineElementCheck(ElementType.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should return false for unregistered element type", () => {
    const element: TBaseElement = {
      type: ElementType.UsualGroup,
    }

    expect(isOneLineElement(element)).toBe(false)
  })

  it("should clear registry correctly", () => {
    const element: TBaseElement = {
      type: ElementType.InputField,
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck(ElementType.InputField, checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: TBaseElement = {
      type: ElementType.InputField,
    }

    const group: TBaseElement = {
      type: ElementType.UsualGroup,
    }

    registerIsOneLineElementCheck(ElementType.InputField, () => true)
    registerIsOneLineElementCheck(ElementType.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
