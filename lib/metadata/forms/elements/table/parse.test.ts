import { describe, expect, it } from "vitest"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { mockСontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { Table } from "./types"

describe("parse Table", () => {
  it("should parse table", () => {
    const mock = "| column 1 | column 2 | column 3 | {name}"

    const expectedResult: Table = {
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

  return parseElement(node, mockСontext)
}
