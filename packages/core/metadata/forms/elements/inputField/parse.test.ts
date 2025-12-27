import { describe, expect, it } from "vitest"
import type { DetectedTreeNode } from "~/packages/core/parser/detector/detectTree"
import { parseElement } from "~/packages/core/parser/elementsParser/parse"
import { lexer } from "~/packages/core/parser/lexer"
import { ParseElementType } from "~/packages/core/parser/types"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import type { InputField } from "./types"

describe("parse InputField", () => {
  it("should parse input field without name", () => {
    const mock = "text:"

    const expectedResult: InputField = {
      elementType: FormElementType.InputField,
      name: "text",
      title: {
        items: { ru: "text" },
      },
      id: undefined,
    }

    const result = parseInputField(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse input field with name", () => {
    const mock = "text: {name}"

    const expectedResult: InputField = {
      elementType: FormElementType.InputField,
      title: {
        items: { ru: "text" },
      },
      name: "name",
      id: undefined,
    }

    const result = parseInputField(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse input field without title", () => {
    const mock = ": {name}"

    const expectedResult: InputField = {
      elementType: FormElementType.InputField,
      name: "name",
      id: undefined,
    }

    const result = parseInputField(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse input field with modificators", () => {
    const mock = ": _В {name}"

    const expectedResult: InputField = {
      elementType: FormElementType.InputField,
      name: "name",
      id: undefined,
      choiceButton: true,
    }

    const result = parseInputField(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseInputField = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.InputField,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
