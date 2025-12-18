import { describe, expect, it } from "vitest"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../../../metadataFactory/types"
import { UsualGroup } from "./types"

describe("parse UsualGroup", () => {
  it("should parse vertical group", () => {
    const mock: DetectedTreeNode = {
      tokens: lexer.tokenize("#vertical").tokens,
      type: ParseElementType.VerticalGroup,
      childItems: [
        {
          tokens: lexer.tokenize("Element").tokens,
          type: ParseElementType.LabelDecoration,
          childItems: [],
        },
      ],
    }

    const expectedResult: UsualGroup = {
      elementType: FormElementType.UsualGroup,
      group: "Vertical",
      name: "vertical",
      id: undefined,
      title: {
        items: { ru: "vertical" },
      },

      childItems: [
        {
          elementType: FormElementType.LabelDecoration,
          name: "Element",
          id: undefined,
          title: {
            items: { ru: "Element" },
          },
        },
      ],
    }
    const result = parseElement(mock, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })

  it("should parse horizontal group", () => {
    const mock: DetectedTreeNode = {
      tokens: lexer.tokenize("=horizontal").tokens,
      type: ParseElementType.HorizontalGroup,
      childItems: [
        {
          tokens: lexer.tokenize("Element").tokens,
          type: ParseElementType.LabelDecoration,
          childItems: [],
        },
      ],
    }

    const expectedResult: UsualGroup = {
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      name: "horizontal",
      id: undefined,
      title: {
        items: { ru: "horizontal" },
      },

      childItems: [
        {
          elementType: FormElementType.LabelDecoration,
          name: "Element",
          id: undefined,
          title: {
            items: { ru: "Element" },
          },
        },
      ],
    }
    const result = parseElement(mock, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
