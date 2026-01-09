import { describe, expect, it } from "vitest"
import type { DetectedTreeNode } from "~/metadata/forms/elements/childItems/parser/detector/detectTree"
import { parseElement } from "~/metadata/forms/elements/childItems/parser/elementsParser/parse"
import { lexer } from "~/metadata/forms/elements/childItems/parser/tokenizer/lexer"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { ParseElementType } from "../childItems/parser/treeParser/types"
import type { RadioButtonField } from "./types"

describe("parse RadioButtonField", () => {
  it("should parseradio button field without header", () => {
    const mock = "(v)option 1()option 2"

    const expectedResult: RadioButtonField = {
      elementType: FormElementType.RadioButtonField,
      name: "",
      choiceList: [
        {
          type: "formChoiceListDesTimeValue",
          value: {
            type: "string",
            value: "option 1",
          },
          presentation: {
            items: { ru: "option 1" },
          },
        },
        {
          type: "formChoiceListDesTimeValue",
          value: {
            type: "string",
            value: "option 2",
          },
          presentation: {
            items: { ru: "option 2" },
          },
        },
      ],
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

  return parseElement(node, mockСontext)
}
