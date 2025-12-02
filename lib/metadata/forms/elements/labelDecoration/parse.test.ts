import { describe, expect, it } from "vitest"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ZElementType } from "../types"
import type { TLabelDecoration } from "./types"
import { ParseElementType } from "~/lib/parser/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

const parseLabelDecoration = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.LabelDecoration,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}

describe("parse LabelDecoration", () => {
  it("should parse label decoration", () => {
    const mock = "text"

    const expectedResult: TLabelDecoration = {
      elementType: ZElementType.enum.LabelDecoration,
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

    const expectedResult: TLabelDecoration = {
      elementType: ZElementType.enum.LabelDecoration,
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

    const expectedResult: TLabelDecoration = {
      elementType: ZElementType.enum.LabelDecoration,
      name: "label",
      id: undefined,
    }

    const result = parseLabelDecoration(mock)
    expect(result).toEqual(expectedResult)
  })
})
