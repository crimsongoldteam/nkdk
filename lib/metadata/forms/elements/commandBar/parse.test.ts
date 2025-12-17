import { describe, expect, it } from "vitest"
import type { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import type { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { FormElementType } from "../types"
import { CommandBar } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse CommandBar", () => {
  it("should parse command bar with buttons", () => {
    const mock = `<Button1|Button2|Button3>`

    const expectedResult: CommandBar = {
      name: "CommandBar",
      id: "1",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Button1",
          id: "1",
          title: {
            items: { ru: "Button1" },
          },
        },
        {
          elementType: FormElementType.Button,
          name: "Button2",
          id: "2",
          title: {
            items: { ru: "Button2" },
          },
        },
        {
          elementType: FormElementType.Button,
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
