import { createTokenInstance } from "chevrotain"
import { describe, expect, it } from "vitest"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { TButton } from "~/lib/metadata/forms/elements/button/types"
import { TCheckBoxField } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { TCommandBar } from "~/lib/metadata/forms/elements/commandBar/types"
import { TInputField } from "~/lib/metadata/forms/elements/inputField/types"
import { TLabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { TPage } from "~/lib/metadata/forms/elements/page/types"
import { TPages } from "~/lib/metadata/forms/elements/pages/types"
import { TRadioButtonField } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { TTable } from "~/lib/metadata/forms/elements/table/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { TUsualGroup } from "~/lib/metadata/forms/elements/usualGroup/types"
import {
  Button,
  CheckboxChecked,
  CheckboxHeader,
  CheckboxLeftFieldType,
  CheckboxRightFieldType,
  Colon,
  CommandBarType,
  GroupHeaderText,
  Hash,
  InputHeader,
  InputValue,
  LabelContent,
  LAngle,
  PageHeaderText,
  RadioButtonChecked,
  RadioButtonFieldType,
  RadioButtonHeader,
  RAngle,
  Slash,
  TableCell,
  TableType,
  VBar,
} from "../lexer"
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

  it("should parse button element", () => {
    const mock: DetectedTreeNode = {
      tokens: [createTokenInstance(Button, "ButtonText", 0, 0, 0, 0, 0, 0)],
      type: ZElementType.enum.Button,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.Button,
      name: "ButtonText",
      id: undefined,
    } as TButton

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse checkbox field element (left)", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(CheckboxLeftFieldType, "", 0, 0, 0, 0, 0, 0),
        createTokenInstance(CheckboxChecked, "[X]", 0, 0, 0, 0, 0, 0),
        createTokenInstance(CheckboxHeader, "CheckboxText", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.CheckBoxField,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.CheckBoxField,
      name: "CheckboxText",
      id: undefined,
    } as TCheckBoxField

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse checkbox field element (right)", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(CheckboxRightFieldType, "", 0, 0, 0, 0, 0, 0),
        createTokenInstance(CheckboxHeader, "CheckboxText", 0, 0, 0, 0, 0, 0),
        createTokenInstance(CheckboxChecked, "[X]", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.CheckBoxField,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.CheckBoxField,
      name: "CheckboxText",
      id: undefined,
    } as TCheckBoxField

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse command bar element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(CommandBarType, "", 0, 0, 0, 0, 0, 0),
        createTokenInstance(LAngle, "<", 0, 0, 0, 0, 0, 0),
        createTokenInstance(Button, "Button1", 0, 0, 0, 0, 0, 0),
        createTokenInstance(VBar, "|", 0, 0, 0, 0, 0, 0),
        createTokenInstance(Button, "Button2", 0, 0, 0, 0, 0, 0),
        createTokenInstance(RAngle, ">", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.CommandBar,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.CommandBar,
      name: "Button1",
      id: undefined,
    } as TCommandBar

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse page element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(Slash, "/", 0, 0, 0, 0, 0, 0),
        createTokenInstance(PageHeaderText, "PageName", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.Page,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.Page,
      name: "PageName",
      id: undefined,
    } as TPage

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse pages element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(Slash, "/", 0, 0, 0, 0, 0, 0),
        createTokenInstance(Slash, "/", 0, 0, 0, 0, 0, 0),
        createTokenInstance(PageHeaderText, "PagesName", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.Pages,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.Pages,
      name: "PagesName",
      id: undefined,
    } as TPages

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse usual group element (vertical)", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(Hash, "#", 0, 0, 0, 0, 0, 0),
        createTokenInstance(GroupHeaderText, "GroupName", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.UsualGroup,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.UsualGroup,
      name: "GroupName",
      id: undefined,
    } as TUsualGroup

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse table element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(TableType, "", 0, 0, 0, 0, 0, 0),
        createTokenInstance(TableCell, "Cell1", 0, 0, 0, 0, 0, 0),
        createTokenInstance(VBar, "|", 0, 0, 0, 0, 0, 0),
        createTokenInstance(TableCell, "Cell2", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.Table,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.Table,
      name: "Cell1",
      id: undefined,
    } as TTable

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })

  it("should parse radio button field element", () => {
    const mock: DetectedTreeNode = {
      tokens: [
        createTokenInstance(RadioButtonFieldType, "", 0, 0, 0, 0, 0, 0),
        createTokenInstance(RadioButtonHeader, "RadioHeader", 0, 0, 0, 0, 0, 0),
        createTokenInstance(Colon, ":", 0, 0, 0, 0, 0, 0),
        createTokenInstance(RadioButtonChecked, "(X)", 0, 0, 0, 0, 0, 0),
      ],
      type: ZElementType.enum.RadioButtonField,
      childItems: [],
    }

    const expectedResult: TBaseElement = {
      elementType: ZElementType.enum.RadioButtonField,
      name: "RadioHeader",
      id: undefined,
    } as TRadioButtonField

    const result = parseElement(mock)

    expect(result).toEqual(expectedResult)
  })
})
