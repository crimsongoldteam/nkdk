import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/elements/childItems/parser/lexer"
import { ParseElementType } from "~/metadata/forms/elements/childItems/parser/types"
import { labelDecorationStructureFixturesTable } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"

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
  const tokens = lexer.tokenize(mock[0]).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.LabelDecoration,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
