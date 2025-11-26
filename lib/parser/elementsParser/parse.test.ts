import { IToken } from "chevrotain"
import { describe, expect, it } from "vitest"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { DetectedTreeNode } from "../treeParser/detectTree"
import { Text } from "../treeParser/lexer"
import { TLabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"

describe("parseElements", () => {
  it("should parse elements", () => {
    const mock: DetectedTreeNode[] = [
      {
        tokens: [{ tokenType: Text, image: "text" } as IToken],
        type: ZElementType.enum.LabelDecoration,
        childItems: [],
      },
    ]

    const expectedResult: TBaseElement[] = [
      {
        elementType: ZElementType.enum.LabelDecoration,
        name: "text",
        id: undefined,
      } as TLabelDecoration,
    ]

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })
})
