import { beforeEach, describe, expect, it } from "vitest"

import { CollectableElement } from "~/metadata/orchestration"
import { InputField } from "../elements/inputField/types"
import { UsualGroup } from "../elements/usualGroup/types"
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
    const element: InputField = {
      itemType: "InputField",
      name: "InputField",
    }

    const checkFunction = (_element: CollectableElement) => true
    registerIsOneLineElementCheck("InputField", checkFunction)

    expect(isOneLineElement(element)).toBe(true)
  })

  it("should clear registry correctly", () => {
    const element: InputField = {
      itemType: "InputField",
      name: "InputField",
    }

    const checkFunction = () => true
    registerIsOneLineElementCheck("InputField", checkFunction)
    expect(isOneLineElement(element)).toBe(true)

    clearIsOneLineElementCheckRegistry()
    expect(isOneLineElement(element)).toBe(false)
  })

  it("should work with multiple element types", () => {
    const inputField: InputField = {
      itemType: "InputField",
      name: "InputField",
    }

    const group: UsualGroup = {
      itemType: "UsualGroup",
      name: "UsualGroup",
      group: "AlwaysHorizontal",
      showTitle: false,
      childItems: [],
    }

    registerIsOneLineElementCheck("InputField", () => true)
    registerIsOneLineElementCheck("UsualGroup", () => false)

    expect(isOneLineElement(inputField)).toBe(true)
    expect(isOneLineElement(group)).toBe(false)
  })
})
