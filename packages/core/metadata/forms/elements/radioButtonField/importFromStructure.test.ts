import { describe, expect, it } from "vitest"
import { parseElement } from "~/metadata/forms/collections/childItems/parser/elementsParser/parse"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { tokenize } from "../../collections/childItems/parser/tokenizer/tokenizer"
import { parseTree } from "../../collections/childItems/parser/treeParser/treeParser"
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
  const tokens = tokenize(mock)

  const treeNodes = parseTree(mockСontext, tokens)

  return parseElement(mockСontext, treeNodes[0])
}
