import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/commonObjects/childItems/parser/elementsParser/parse"
import { tokenize } from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "~/metadata/forms/commonObjects/childItems/parser/treeParser/treeParser"
import { pictureDecorationStructureFixturesTable } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromStructure", () => {
  it.each(pictureDecorationStructureFixturesTable.filter((tc) => !tc.skipImport))(
    "should import picture decoration $name",
    ({ element: input, structured: structured }) => {
      const result = importPictureDecorationFromStructure(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importPictureDecorationFromStructure = (mockContext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockContext, tokens)

  return parseElement(mockContext, treeNodes[0])
}
