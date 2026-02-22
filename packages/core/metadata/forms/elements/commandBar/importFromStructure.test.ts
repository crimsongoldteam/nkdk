import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { commandBarStructureFixturesTable } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { parseElement } from "../../commonObjects/childItems/parser/elementsParser/parse"
import { tokenize } from "../../commonObjects/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../commonObjects/childItems/parser/treeParser/treeParser"

describe("importCommandBarFromStructure", () => {
  it.each(commandBarStructureFixturesTable)(
    "should import command bar $name",
    ({ element: input, structured: structured }) => {
      const result = importCommandBarFromStructure(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importCommandBarFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const nodes = parseTree(mockContext, tokens)

  return parseElement(mockContext, nodes[0])
}
