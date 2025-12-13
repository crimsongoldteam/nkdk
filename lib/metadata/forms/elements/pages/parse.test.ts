import { describe, it, expect } from "vitest"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { FormElementType } from "../types"
import { TPages } from "./types"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

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

    const expectedResult: TPages = {
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
    const result = parseElement(mock, configurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
