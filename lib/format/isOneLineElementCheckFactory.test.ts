import { describe, it, expect, beforeEach } from "vitest"
import {
  registerIsOneLineElementCheck,
  isOneLineElement,
  clearIsOneLineElementCheckRegistry,
} from "./isOneLineElementCheckFactory"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { ZElementType } from "../metadata/forms/elements/types"

describe("isOneLineElementCheckFactory", () => {
  beforeEach(() => {
    clearIsOneLineElementCheckRegistry()
  })

  it("should register and use check function for element type", () => {
    const element: TBaseElement = {
      elementType: ZElementType.enum.InputField,
      name: "InputField",
      id: "1",
    }

    const checkFunction = (_element: TBaseElement) => true
    registerIsOneLineElementCheck(ZElementType.enum.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should return false for unregistered element type", () => {
    const element: TBaseElement = {
      elementType: ZElementType.enum.UsualGroup,
      name: "UsualGroup",
      id: "1",
    }

    expect(isOneLineElement(element)).toBe(false)
  })

  it("should clear registry correctly", () => {
    const element: TBaseElement = {
      elementType: ZElementType.enum.InputField,
      name: "InputField",
      id: "1",
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck(ZElementType.enum.InputField, checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: TBaseElement = {
      elementType: ZElementType.enum.InputField,
      name: "InputField",
      id: "2",
    }

    const group: TBaseElement = {
      elementType: ZElementType.enum.UsualGroup,
      name: "UsualGroup",
      id: "1",
    }

    registerIsOneLineElementCheck(ZElementType.enum.InputField, () => true)
    registerIsOneLineElementCheck(ZElementType.enum.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
