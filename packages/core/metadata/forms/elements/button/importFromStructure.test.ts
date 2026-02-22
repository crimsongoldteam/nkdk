import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/commonObjects/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { parseTree } from "../../commonObjects/childItems/parser/treeParser/treeParser"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", ({ element: input, structured: structured }) => {
    const result = importButtonFromStructure(mockContext, structured.strings)

    expect(result).toEqual(input)
  })
})

const importButtonFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
  const tokens = lexer.tokenize(mock[0]).tokens

  const node = parseTree(mockContext, tokens)

  return parseElement(mockContext, node[0])
}
