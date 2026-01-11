import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", ({ element: input, structured: structured }) => {
    const result = importButtonFromStructure(mockСontext, structured.strings)

    expect(result).toEqual(input)
  })
})

const importButtonFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = lexer.tokenize(mock[0]).tokens

  const node = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, node[0])
}
