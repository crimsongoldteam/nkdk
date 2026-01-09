import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/elements/childItems/parser/lexer"
import { ParseElementType } from "~/metadata/forms/elements/childItems/parser/types"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", ({ element: input, structured: structured }) => {
    const result = importButtonFromStructure(mockСontext, structured.strings)

    expect(result).toEqual(input)
  })
})

const importButtonFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = lexer.tokenize(mock[0]).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.Button,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
