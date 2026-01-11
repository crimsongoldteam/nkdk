import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { labelDecorationStructureFixturesTable } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importLabelDecorationFromStructure", () => {
  it.each(labelDecorationStructureFixturesTable)(
    "should import label decoration $name",
    ({ element: input, structured: structured }) => {
      const result = importLabelDecorationFromStructure(mockСontext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importLabelDecorationFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, treeNodes[0])
}
