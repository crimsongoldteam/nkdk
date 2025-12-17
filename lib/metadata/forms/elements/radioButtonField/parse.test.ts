import { describe, expect, it } from "vitest"
import type { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import type { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { FormElementType } from "../types"
import type { RadioButtonField } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse RadioButtonField", () => {
  it("should parseradio button field without header", () => {
    const mock = "(v)option 1()option 2"

    const expectedResult: RadioButtonField = {
      elementType: FormElementType.RadioButtonField,
      name: "",
      choiceList: {
        items: [
          {
            value: "option 1",
            presentation: {
              items: { ru: "option 1" },
            },
            checkState: 1,
          },
          {
            value: "option 2",
            presentation: {
              items: { ru: "option 2" },
            },
            checkState: 2,
          },
        ],
      },
    }

    const result = parseRadioButtonField(mock)
    expect(result).toEqual(expectedResult)
  })
})

const parseRadioButtonField = (mock: string) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type: ParseElementType.RadioButtonField,
    childItems: [],
  }

  return parseElement(node, configurationSettings)
}
