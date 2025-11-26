import { createTokenInstance } from "chevrotain"
import { describe, expect, it } from "vitest"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { TInputField } from "~/lib/metadata/forms/elements/inputField/types"
import { TLabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { Colon, InputHeader, InputValue, LabelContent } from "../lexer"
import { DetectedTreeNode } from "../treeParser/detectTree"
import { parseElement } from "./parse"

describe("parseElements", () => {
  it("should parse label decoration element", () => {
    const mock: DetectedTreeNode = {
      tokens: [createTokenInstance(LabelContent, "text", 0, 0, 0, 0, 0, 0)],
      type: ZElementType.enum.LabelDecoration,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.LabelDecoration,
      name: "text",
      id: undefined,
    } as TLabelDecoration

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse input field element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(InputHeader, "text", 0, 0, 0, 0, 0, 0),
        createTokenInstance(Colon, ":", 0, 0, 0, 0, 0, 0),
        createTokenInstance(InputValue, "value", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.InputField,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.InputField,
      name: "text",
      id: undefined,
    } as TInputField

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })
})
