import { beforeEach, expect, it, vi } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { mockContext } from "~/tests/mockContext"
import { NamedElement } from "../elements/baseElement/types"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"
beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: NamedElement = {
    itemType: FormElementType.InputField,
    name: "InputField",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockContext, mockData)).toEqual(["test"])
})
