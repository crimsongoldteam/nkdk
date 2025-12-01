import { describe, it, expect } from "vitest"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import { lexer } from "~/lib/parser/treeParser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { ZElementType } from "../types"
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
      elementType: ZElementType.enum.Pages,
      name: "pages",
      title: {
        items: { ru: "pages" },
      },
      childItems: [
        {
          elementType: ZElementType.enum.Page,
          name: "Page",
          title: {
            items: { ru: "Page" },
          },
          childItems: [
            {
              elementType: ZElementType.enum.LabelDecoration,
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
