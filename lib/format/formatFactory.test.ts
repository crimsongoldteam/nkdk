import { expect, vi, it, beforeEach } from "vitest"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { ZElementType } from "../metadata/forms/elements/types"
import {
  clearFormatRegistry,
  formatElement,
  registerFormat,
} from "./formatFactory"
import { TConfigurationSettings } from "../metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: TBaseElement = {
    elementType: ZElementType.enum.InputField,
    name: "InputField",
    id: "1",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockData, configurationSettings)).toEqual(["test"])
})
