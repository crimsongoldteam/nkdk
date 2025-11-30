import { describe, expect, it } from "vitest"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { ZElementType } from "../types"
import type { TButton } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseButton", () => {
  it("should parse button without name", () => {
    const mock = "<label>"

    const expectedResult: TButton = {
      elementType: ZElementType.enum.Button,
      name: "label",
      title: {
        items: { ru: "label" },
      },
      id: undefined,
    }

    const result = parseButton(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseButton = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.Button,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
