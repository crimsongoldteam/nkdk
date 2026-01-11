import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { checkBoxFieldStructureFixturesTable } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { ParseElementType } from "../../collections/childItems/parser/treeParser/types"

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
  const tokens = lexer.tokenize(mock[0]).tokens

  // Determine parse type based on structure
  let parseType: ParseElementType
  if (mock[0].startsWith("[]") || mock[0].startsWith("[|1]")) {
    parseType = ParseElementType.RightTitledCheckboxField
  } else {
    parseType = ParseElementType.LeftTitledCheckboxField
  }

  const node: DetectedTreeNode = {
    tokens,
    type: parseType,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
