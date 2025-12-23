import { beforeEach, expect, it, vi } from "vitest"
import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadata/metadataFactory/types"
import { mockСontext } from "../tests/mockContext"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"

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

  expect(formatElement(mockData, mockСontext)).toEqual(["test"])
})
