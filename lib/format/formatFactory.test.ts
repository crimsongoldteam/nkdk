import { expect, vi, it, beforeEach } from "vitest"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadata/forms/elements/types"
import {
  clearFormatRegistry,
  formatElement,
  registerFormat,
} from "./formatFactory"
import { ConfigurationSettings } from "../metadata/configurationSettings/types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: BaseElement = {
    elementType: FormElementType.InputField,
    name: "InputField",
    id: "1",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockData, configurationSettings)).toEqual(["test"])
})
