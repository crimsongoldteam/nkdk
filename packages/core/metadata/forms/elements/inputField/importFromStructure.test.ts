import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { DetectedTreeNode } from "~/parser/detector/detectTree"
import { parseElement } from "~/parser/elementsParser/parse"
import { lexer } from "~/parser/lexer"
import { ParseElementType } from "~/parser/types"
import { inputFieldStructureFixturesTable } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"

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
