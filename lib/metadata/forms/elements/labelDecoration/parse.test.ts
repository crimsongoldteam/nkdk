import { describe, expect, it } from "vitest"
import type { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { mockСontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import type { LabelDecoration } from "./types"

const parseLabelDecoration = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.LabelDecoration,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}

describe("parse LabelDecoration", () => {
  it("should parse label decoration", () => {
    const mock = "text"

    const expectedResult: LabelDecoration = {
      elementType: FormElementType.LabelDecoration,
      name: "text",
      title: {
        items: { ru: "text" },
      },
      id: undefined,
    }

    const result = parseLabelDecoration(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse label decoration with name", () => {
    const mock = "text {name}"

    const expectedResult: LabelDecoration = {
      elementType: FormElementType.LabelDecoration,
      title: {
        items: { ru: "text" },
      },
      name: "name",
      id: undefined,
    }

    const result = parseLabelDecoration(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse label decoration without title", () => {
    const mock = "{label}"

    const expectedResult: LabelDecoration = {
      elementType: FormElementType.LabelDecoration,
      name: "label",
      id: undefined,
    }

    const result = parseLabelDecoration(mock)
    expect(result).toEqual(expectedResult)
  })
})
