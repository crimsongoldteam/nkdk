import { expect, vi, it, beforeEach } from "vitest"
import { TBaseElement } from "../metadata/forms/elements/baseElement/types"
import { ElementType } from "../metadata/systemEnumerations/types"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"

beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: TBaseElement = {
    type: ElementType.InputField,
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockData)).toEqual(["test"])
})
