import { beforeEach, expect, it, vi } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { FormElementType } from "../../metadataFactory/types"
import { NamedElement } from "../elements/baseElement/types"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"
beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: NamedElement = {
    elementType: FormElementType.InputField,
    name: "InputField",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockContext, mockRule, mockData)).toEqual(["test"])
})
