import { describe, expect, it } from "vitest"
import { DetectedTreeNode } from "~/packages/core/parser/detector/detectTree"
import { parseElement } from "~/packages/core/parser/elementsParser/parse"
import { lexer } from "~/packages/core/parser/lexer"
import { ParseElementType } from "~/packages/core/parser/types"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { CheckBoxField } from "./types"

describe("parse CheckBoxField", () => {
  it("should parse right titled check box field without name", () => {
    const mock = "[]checkbox"

    const expectedResult: CheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(mock, ParseElementType.RightTitledCheckboxField)
    expect(result).toEqual(expectedResult)
  })

  it("should parse left titled check box field without name", () => {
    const mock = "checkbox[]"

    const expectedResult: CheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(mock, ParseElementType.LeftTitledCheckboxField)
    expect(result).toEqual(expectedResult)
  })

  it("should parse right titled switch", () => {
    const mock = "[|1]checkbox"

    const expectedResult: CheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      checkBoxType: "Switch",
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(mock, ParseElementType.RightTitledCheckboxField)
    expect(result).toEqual(expectedResult)
  })

  it("should parse left titled switch", () => {
    const mock = "checkbox[|1]"

    const expectedResult: CheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      checkBoxType: "Switch",
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(mock, ParseElementType.LeftTitledCheckboxField)
    expect(result).toEqual(expectedResult)
  })
})

const parseCheckBoxField = (mock: string, type: ParseElementType) => {
  const tokens = lexer.tokenize(mock).tokens

  const node: DetectedTreeNode = {
    tokens,
    type,
    childItems: [],
  }

  return parseElement(node, mockСontext)
}
