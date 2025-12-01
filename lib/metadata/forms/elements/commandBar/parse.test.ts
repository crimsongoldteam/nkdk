import { describe, expect, it } from "vitest"
import { ZElementType } from "../types"
import type { TCommandBar } from "./types"
import { lexer } from "~/lib/parser/treeParser/lexer"
import type { DetectedTreeNode } from "~/lib/parser/treeParser/detectTree"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { ParseElementType } from "~/lib/parser/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse CommandBar", () => {
  it("should parse command bar with buttons", () => {
    const mock = `<Button1|Button2|Button3>`

    const expectedResult: TCommandBar = {
      name: "CommandBar",
      id: "1",
      elementType: ZElementType.enum.CommandBar,
      childItems: [
        {
          elementType: ZElementType.enum.Button,
          name: "Button1",
          id: "1",
          title: {
            items: { ru: "Button1" },
          },
        },
        {
          elementType: ZElementType.enum.Button,
          name: "Button2",
          id: "2",
          title: {
            items: { ru: "Button2" },
          },
        },
        {
          elementType: ZElementType.enum.Button,
          name: "Button3",
          id: "3",
          title: {
            items: { ru: "Button3" },
          },
        },
      ],
    }

    const result = parseCommandBar(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseCommandBar = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.CommandBar,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
