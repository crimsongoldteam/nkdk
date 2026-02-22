import { describe, expect, it } from "vitest"
import { parseElement } from "~/metadata/forms/commonObjects/childItems/parser/elementsParser/parse"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { mockContext } from "~/tests/mockContext"
import { tokenize } from "../../commonObjects/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../commonObjects/childItems/parser/treeParser/treeParser"
import { Table } from "./types"

describe("parse Table", () => {
  it("should parse table", () => {
    const mock = "| column 1 | column 2 | column 3 | {name}"

    const expectedResult: Table = {
      itemType: CollectionFormElementType.Table,
      name: "name",
      childItems: [
        {
          itemType: CollectionFormElementType.InputField,
          name: "column 1",
        },
        {
          itemType: CollectionFormElementType.InputField,
          name: "column 2",
        },
        {
          itemType: CollectionFormElementType.InputField,
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
