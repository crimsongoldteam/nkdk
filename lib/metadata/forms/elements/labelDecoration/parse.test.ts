import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ZElementType } from "../types"
import { TLabelDecoration } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
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

    const tokens = lexer.tokenize(mock).tokens

    const node: DetectedTreeNode = {
      tokens,
      type: ZElementType.enum.LabelDecoration,
      childItems: [],
    }

    const result = parseElement(node, configurationSettings)
    expect(result).toEqual(expectedResult)
  })

  it("should parse label decoration with name", () => {
    const mock = "text {label}"

    const expectedResult: TLabelDecoration = {
      elementType: ZElementType.enum.LabelDecoration,
      title: {
        items: { ru: "text" },
      },
      name: "label",
      id: undefined,
    }

    const tokens = lexer.tokenize(mock).tokens

    const node: DetectedTreeNode = {
      tokens,
      type: ZElementType.enum.LabelDecoration,
      childItems: [],
    }

    const result = parseElement(node, configurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
