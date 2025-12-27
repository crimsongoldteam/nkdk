import { describe, expect, it } from "vitest"
import { DetectedTreeNode } from "~/packages/core/parser/detector/detectTree"
import { parseElement } from "~/packages/core/parser/elementsParser/parse"
import { lexer } from "~/packages/core/parser/lexer"
import { ParseElementType } from "~/packages/core/parser/types"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { Pages } from "./types"

describe("parse Pages", () => {
  it("should parse pages", () => {
    const mock: DetectedTreeNode = {
      tokens: lexer.tokenize("//pages").tokens,
      type: ParseElementType.Pages,
      childItems: [
        {
          tokens: lexer.tokenize("/Page").tokens,
          type: ParseElementType.Page,
          childItems: [
            {
              tokens: lexer.tokenize("Element").tokens,
              type: ParseElementType.LabelDecoration,
              childItems: [],
            },
          ],
        },
      ],
    }

    const expectedResult: Pages = {
      elementType: FormElementType.Pages,
      name: "pages",
      title: {
        items: { ru: "pages" },
      },
      childItems: [
        {
          elementType: FormElementType.Page,
          name: "Page",
          title: {
            items: { ru: "Page" },
          },
          childItems: [
            {
              elementType: FormElementType.LabelDecoration,
              name: "Element",
              title: {
                items: { ru: "Element" },
              },
            },
          ],
        },
      ],
    }
    const result = parseElement(mock, mockСontext)
    expect(result).toEqual(expectedResult)
  })
})
