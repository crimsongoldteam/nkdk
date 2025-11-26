import { describe, expect, it } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { simlifyDetectedTreeNodes } from "~/lib/tests/simlifyToken"
import { detectTreeNodes } from "./detectTree"
import { TreeNode } from "./parseTree"

describe("detectTreeNodes", () => {
  it("should detect label decoration for plain text", () => {
    const mock: TreeNode[] = [{ content: "text" }]

    const expectedResult = [
      {
        tokens: [{ type: "Text", value: "text" }],
        type: ZElementType.enum.LabelDecoration,
        childItems: [],
      },
    ]

    const result = detectTreeNodes(mock)

    const simplifiedResult = simlifyDetectedTreeNodes(result)

    expect(simplifiedResult).toEqual(expectedResult)
  })

  it("should detect usual group starting with #", () => {
    const mock: TreeNode[] = [
      { content: "#VerticalGroup", childItems: [{ content: "text" }] },
    ]

    const expectedResult = [
      {
        tokens: [
          { type: "Hash", value: "#" },
          { type: "Text", value: "VerticalGroup" },
        ],
        type: ZElementType.enum.UsualGroup,
        childItems: [
          {
            tokens: [{ type: "Text", value: "text" }],
            type: ZElementType.enum.LabelDecoration,
            childItems: [],
          },
        ],
      },
    ]

    const result = detectTreeNodes(mock)

    const simplifiedResult = simlifyDetectedTreeNodes(result)

    expect(simplifiedResult).toEqual(expectedResult)
  })
})
