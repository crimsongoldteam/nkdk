import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { commandBarStructureFixturesTable } from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { parseElement } from "../../collections/childItems/parser/elementsParser/parse"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importCommandBarFromStructure", () => {
  it.each(commandBarStructureFixturesTable)(
    "should import command bar $name",
    ({ element: input, structured: structured }) => {
      const result = importCommandBarFromStructure(mockСontext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importCommandBarFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const nodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, nodes[0])
}
