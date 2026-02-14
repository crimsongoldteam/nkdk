import { beforeEach, describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { NamedElement } from "../elements/baseElement/types"
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
    const element: NamedElement = {
      itemType: FormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = (_element: NamedElement) => true
    registerIsOneLineElementCheck(FormElementType.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should clear registry correctly", () => {
    const element: NamedElement = {
      itemType: FormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck(FormElementType.InputField, checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: NamedElement = {
      itemType: FormElementType.InputField,
      name: "InputField",
    }

    const group: NamedElement = {
      itemType: FormElementType.UsualGroup,
      name: "UsualGroup",
    }

    registerIsOneLineElementCheck(FormElementType.InputField, () => true)
    registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
