import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"
import { parseElement } from "../../collections/childItems/parser/elementsParser/parse"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importTableFromStructure", () => {
  it.each(tableStructureFixtures)("should import table $name", ({ table: expected, structure }) => {
    const result = importTableFromStructure(mockContext, [structure])

    expect(result).toEqual(expected)
  })
})

const importTableFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockContext, tokens, true)

  const node = treeNodes[0].type === "AutoCommandBar" ? treeNodes[1] : treeNodes[0]

  return parseElement(mockContext, node)
}
