import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { DetectedTreeNode } from "~/parser/detector/detectTree"
import { parseElement } from "~/parser/elementsParser/parse"
import { lexer } from "~/parser/lexer"
import { ParseElementType } from "~/parser/types"
import { commandBarStructureFixturesTable } from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"

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

