import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { checkBoxFieldStructureFixturesTable } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"

describe("importCheckBoxFieldFromStructure", () => {
  it.each(checkBoxFieldStructureFixturesTable)(
    "should import check box field $name",
    ({ element: input, structured: structured }) => {
      const result = importCheckBoxFieldFromStructure(mockСontext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})

const importCheckBoxFieldFromStructure = (mockСontext: ConfigurationContext, mock: string[]) => {
  const tokens = tokenize(mock[0])

  const nodes = parseTree(mockСontext, tokens)
  return parseElement(mockСontext, nodes[0])
}
