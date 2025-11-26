import { CstNode } from "chevrotain"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { DetectedTreeNode } from "../treeParser/detectTree"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"

export const parseElement = (element: DetectedTreeNode): TBaseElement => {
  const ast = parseByElementType(element)

  const cst = visitor.visit(ast)

  return cst
}

const parseByElementType = (element: DetectedTreeNode): CstNode => {
  switch (element.type) {
    case ZElementType.enum.LabelDecoration:
      return elementsParser.parseLabelDecoration(element.tokens)
    case ZElementType.enum.InputField:
      return elementsParser.parseInputField(element.tokens)
    case ZElementType.enum.Button:
      return elementsParser.parseButton(element.tokens)
    case ZElementType.enum.CheckBoxField:
      return elementsParser.parseCheckBoxField(element.tokens)
    case ZElementType.enum.CommandBar:
      return elementsParser.parseCommandBar(element.tokens)
    case ZElementType.enum.Page:
      return elementsParser.parsePage(element.tokens)
    case ZElementType.enum.Pages:
      return elementsParser.parsePages(element.tokens)
    case ZElementType.enum.UsualGroup:
      return elementsParser.parseUsualGroup(element.tokens)
    case ZElementType.enum.Table:
      return elementsParser.parseTable(element.tokens)
    case ZElementType.enum.RadioButtonField:
      return elementsParser.parseRadioButtonField(element.tokens)
    default:
      throw new Error(`Unknown element type: ${element.type}`)
  }
}
