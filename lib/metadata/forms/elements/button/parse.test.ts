import { describe, expect, it } from "vitest"
import type { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { mockСontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { Button } from "./types"

describe("parseButton", () => {
  it("should parse button without name", () => {
    const mock = "<label>"

    const expectedResult: Button = {
      elementType: FormElementType.Button,
      name: "label",
      title: {
        items: { ru: "label" },
      },
      id: undefined,
    }

    const result = parseButton(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseButton = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.Button,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
