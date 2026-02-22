import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/commonObjects/childItems/parser/elementsParser/parse"
import { inputFieldStructureFixturesTable } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { tokenize } from "../../commonObjects/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../commonObjects/childItems/parser/treeParser/treeParser"

describe("importInputFieldFromStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should import input field $name",
    ({ element: input, structured: structured }) => {
      const result = importInputFieldFromStructure(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importInputFieldFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockContext, tokens)

  return parseElement(mockContext, treeNodes[0])
}
