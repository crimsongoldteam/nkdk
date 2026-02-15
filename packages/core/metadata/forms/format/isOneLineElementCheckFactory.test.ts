import { beforeEach, describe, expect, it } from "vitest"
import { NamedElement } from "../elements/baseElement/types"
import {
  clearIsOneLineElementCheckRegistry,
  isOneLineElement,
  registerIsOneLineElementCheck,
} from "./isOneLineElementCheckFactory"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

describe("isOneLineElementCheckFactory", () => {
  beforeEach(() => {
    clearIsOneLineElementCheckRegistry()
  })

  it("should register and use check function for element type", () => {
    const element: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = (_element: NamedElement) => true
    registerIsOneLineElementCheck(CollectionFormElementType.InputField, checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should clear registry correctly", () => {
    const element: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "InputField",
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck(CollectionFormElementType.InputField, checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "InputField",
    }

    const group: NamedElement = {
      itemType: CollectionFormElementType.UsualGroup,
      name: "UsualGroup",
    }

    registerIsOneLineElementCheck(CollectionFormElementType.InputField, () => true)
    registerIsOneLineElementCheck(CollectionFormElementType.UsualGroup, () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
