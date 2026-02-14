import { describe, expect, it } from "vitest"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { mockContext } from "~/tests/mockContext"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"
import { Table } from "./types"

describe("parse Table", () => {
  it("should parse table", () => {
    const mock = "| column 1 | column 2 | column 3 | {name}"

    const expectedResult: Table = {
      itemType: FormElementType.Table,
      name: "name",
      childItems: [
        {
          itemType: FormElementType.InputField,
          name: "column 1",
        },
        {
          itemType: FormElementType.InputField,
          name: "column 2",
        },
        {
          itemType: FormElementType.InputField,
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

  const node = parseTree(mockContext, tokens)

  return parseElement(mockContext, node[0])
}
