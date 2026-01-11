import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { commandBarStructureFixturesTable } from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { ParseElementType } from "../../collections/childItems/parser/treeParser/types"

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
  const tokens = lexer.tokenize(mock[0]).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.CommandBar,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
