import { describe, expect, it } from "vitest"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { parseElement } from "~/lib/parser/elementsParser/parse"
import type { DetectedTreeNode } from "~/lib/parser/detector/detectTree"
import { lexer } from "~/lib/parser/lexer"
import { ParseElementType } from "~/lib/parser/types"
import { FormElementType } from "../types"
import type { TCheckBoxField } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parse CheckBoxField", () => {
  it("should parse right titled check box field without name", () => {
    const mock = "[]checkbox"

    const expectedResult: TCheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: SE.ZItemHorizontalLocation.enum.Right,
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(
      mock,
      ParseElementType.RightTitledCheckboxField
    )
    expect(result).toEqual(expectedResult)
  })

  it("should parse left titled check box field without name", () => {
    const mock = "checkbox[]"

    const expectedResult: TCheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(
      mock,
      ParseElementType.LeftTitledCheckboxField
    )
    expect(result).toEqual(expectedResult)
  })

  it("should parse right titled switch", () => {
    const mock = "[|1]checkbox"

    const expectedResult: TCheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: SE.ZItemHorizontalLocation.enum.Right,
      checkBoxType: SE.ZCheckBoxType.enum.Switch,
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(
      mock,
      ParseElementType.RightTitledCheckboxField
    )
    expect(result).toEqual(expectedResult)
  })

  it("should parse left titled switch", () => {
    const mock = "checkbox[|1]"

    const expectedResult: TCheckBoxField = {
      elementType: FormElementType.CheckBoxField,
      checkBoxType: SE.ZCheckBoxType.enum.Switch,
      name: "checkbox",
      title: {
        items: { ru: "checkbox" },
      },
      id: undefined,
    }

    const result = parseCheckBoxField(
      mock,
      ParseElementType.LeftTitledCheckboxField
    )
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

  return parseElement(node, configurationSettings)
}
