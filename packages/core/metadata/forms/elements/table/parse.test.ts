import { describe, expect, it } from "vitest"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { Table } from "./types"
import { tokenize } from "../childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../childItems/parser/treeParser/treeParser"

describe("parse Table", () => {
  it("should parse table", () => {
    const mock = "| column 1 | column 2 | column 3 | {name}"

    const expectedResult: Table = {
      elementType: FormElementType.Table,
      name: "name",
      childItems: [
        {
          elementType: FormElementType.InputField,
          name: "column 1",
        },
        {
          elementType: FormElementType.InputField,
          name: "column 2",
        },
        {
          elementType: FormElementType.InputField,
          name: "column 3",
        },
      ],
    }
    const result = parseTable(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseTable = (mock: string) => {
  const tokens = tokenize(mock)

  const node = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, node[0])
}
