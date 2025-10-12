import { expect, vi, it, beforeEach } from "vitest"
import { TElement } from "../metadata/forms/elements/element/types"
import { ElementType } from "../metadata/systemEnumerations/types"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"

beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: TElement = {
    type: ElementType.InputField,
    id: "1",
    name: "test",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockData)).toEqual(["test"])
})
