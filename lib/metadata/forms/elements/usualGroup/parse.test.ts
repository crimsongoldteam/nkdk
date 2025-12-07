import { describe, expect, it } from "vitest"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { ZElementType } from "../types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TUsualGroup } from "./types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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

    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZChildFormItemsGroup.enum.Vertical,
      name: "vertical",
      id: undefined,
      title: {
        items: { ru: "vertical" },
      },

      childItems: [
        {
          elementType: ZElementType.enum.LabelDecoration,
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

    const expectedResult: TUsualGroup = {
      elementType: ZElementType.enum.UsualGroup,
      group: SE.ZChildFormItemsGroup.enum.Horizontal,
      name: "horizontal",
      id: undefined,
      title: {
        items: { ru: "horizontal" },
      },

      childItems: [
        {
          elementType: ZElementType.enum.LabelDecoration,
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
