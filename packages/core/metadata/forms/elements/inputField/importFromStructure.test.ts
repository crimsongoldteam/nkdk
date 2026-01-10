import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { inputFieldStructureFixturesTable } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { tokenize } from "../childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../childItems/parser/treeParser/treeParser"

describe("importInputFieldFromStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should import input field $name",
    ({ element: input, structured: structured }) => {
      const result = importInputFieldFromStructure(mockСontext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importInputFieldFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, treeNodes[0])
}
