import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/elements/childItems/parser/tokenizer/lexer"
import { inputFieldStructureFixturesTable } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { ParseElementType } from "../childItems/parser/treeParser/types"

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
  const tokens = lexer.tokenize(mock[0]).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.InputField,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
