import { describe, expect, it } from "vitest"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ZElementType } from "../types"
import type { TCheckBoxField } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse CheckBoxField", () => {
  it("should parse check box field without name", () => {
    const mock = "[]checkbox"

    const expectedResult: TCheckBoxField = {
      elementType: ZElementType.enum.CheckBoxField,
      name: "checkbox",
      id: undefined,
    }

    const result = parseCheckBoxField(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseCheckBoxField = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ZElementType.enum.CheckBoxField,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
