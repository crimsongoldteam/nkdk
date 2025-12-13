import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { FormElementType } from "../types"
import { UsualGroup } from "./types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

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
      group: SE.ChildFormItemsGroup.Vertical,
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
    const result = parseElement(mock, configurationSettings)
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
      group: SE.ChildFormItemsGroup.Horizontal,
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
    const result = parseElement(mock, configurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
