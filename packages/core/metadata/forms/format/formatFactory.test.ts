import { beforeEach, expect, it, vi } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { NamedElement } from "../elements/baseElement/types"
import { clearFormatRegistry, formatElement, registerFormat } from "./formatFactory"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
beforeEach(() => {
  clearFormatRegistry()
})

it("should register a format function", () => {
  const mockFormat = vi.fn().mockReturnValue(["test"])
  const mockCheck = vi.fn().mockReturnValue(true)

  const mockData: NamedElement = {
    itemType: CollectionFormElementType.InputField,
    name: "InputField",
  }

  registerFormat(mockFormat, mockCheck)

  expect(formatElement(mockContext, mockData)).toEqual(["test"])
})
