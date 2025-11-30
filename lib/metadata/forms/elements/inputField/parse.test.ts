import { describe, expect, it } from "vitest"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ZElementType } from "../types"
import type { TInputField } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse InputField", () => {
  it("should parse input field without name", () => {
    const mock = "text:"

    const expectedResult: TInputField = {
      elementType: ZElementType.enum.InputField,
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

    const expectedResult: TInputField = {
      elementType: ZElementType.enum.InputField,
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

    const expectedResult: TInputField = {
      elementType: ZElementType.enum.InputField,
      name: "name",
      id: undefined,
    }

    const result = parseInputField(mock)
    expect(result).toEqual(expectedResult)
  })

  it("should parse input field with modificators", () => {
    const mock = ": _В {name}"

    const expectedResult: TInputField = {
      elementType: ZElementType.enum.InputField,
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
    type: ZElementType.enum.InputField,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
