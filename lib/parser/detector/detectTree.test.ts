import { describe, expect, it } from "vitest"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { simlifyDetectedTreeNodes } from "~/lib/tests/simlifyToken"
import { detectTreeNodes } from "./detectTree"
import type { TreeNode } from "../treeParser/parseTree"
import { ParseElementType } from "../types"

describe("detectTreeNodes", () => {
  it("should detect label decoration for plain text", () => {
    const mock: TreeNode[] = [{ content: "text" }]

    const expectedResult = [
      {
        tokens: [{ type: "Text", value: "text" }],
        type: FormElementType.LabelDecoration,
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

    const result = detectTreeNodes(mock)

    expect(result[0].type).toEqual(ParseElementType.VerticalGroup)
  })
})
