import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import "~/metadata/forms/elements/exportToStructure"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { parseElement } from "../../collections/childItems/parser/elementsParser/parse"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importTableFromStructure", () => {
  it.each(tableStructureFixtures)("should import table $name", ({ table: expected, structure }) => {
    const result = importTableFromStructure(mockСontext, [structure])

    expect(result).toEqual(expected)
  })
})

const importTableFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, treeNodes[0])
}
