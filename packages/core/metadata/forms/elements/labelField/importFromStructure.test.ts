import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { labelFieldStructureFixturesTable } from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importLabelFieldFromStructure", () => {
  describe("importLabelFieldFromStructure", () => {
    it.each(labelFieldStructureFixturesTable)(
      "should import label field $name",
      ({ element: label, structured: structured }) => {
        const result = importLabelFieldFromStructure(mockСontext, structured.strings)

        expect(result).toEqual(label)
      }
    )
  })
})

const importLabelFieldFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const treeNodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, treeNodes[0])
}
