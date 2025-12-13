import { lexer } from "~/lib/parser/lexer"
import { FormElementType } from "../types"
import { TTable } from "./types"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { describe, it, expect } from "vitest"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { ParseElementType } from "~/lib/parser/types"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse Table", () => {
  it("should parse table", () => {
    const mock = "| column 1 | column 2 | column 3 | {name}"

    const expectedResult: TTable = {
      elementType: FormElementType.Table,
      name: "name",
      id: undefined,
      childItems: [
        {
          elementType: FormElementType.InputField,
          name: "column 1",
          id: undefined,
        },
        {
          elementType: FormElementType.InputField,
          name: "column 2",
          id: undefined,
        },
        {
          elementType: FormElementType.InputField,
          name: "column 3",
          id: undefined,
        },
      ],
    }
    const result = parseTable(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseTable = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.Table,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
