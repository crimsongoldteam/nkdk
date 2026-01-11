import type { CstNode, IToken } from "chevrotain"
import type { ConfigurationContext } from "~/metadata/context/types"
import { ChildItems } from "~/metadata/forms/collections/childItems/types"
import type { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { BuilderTreeNode, ParseElementType, TreeNode } from "../treeParser/types"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"
import { AutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/types"

export const parseElement = (context: ConfigurationContext, element: TreeNode): BaseElement => {
  const ast = parseByElementType(element)

  const cst = visitor.visit(ast, context)

  // Обрабатываем childItems рекурсивно
  addChildItemsToResult(context, cst, element)

  return cst
}

export const parseOneLineGroupElements = (
  context: ConfigurationContext,
  element: BuilderTreeNode
): {
  group: IToken[]
  elements: IToken[][]
} => {
  const ast = elementsParser.parseOneLineGroupElements(element.tokens)
  const cst = visitor.visit(ast, context)
  return cst
}

const addChildItemsToResult = (context: ConfigurationContext, cst: BaseElement, element: TreeNode): void => {
  if (!("childItems" in cst)) return

  if (element.type === ParseElementType.CommandBar) return

  // Для таблицы childItems уже установлены в visitor из ячеек первой строки
  // Не перезаписываем их, если они уже есть
  if (element.type === ParseElementType.Table && cst.childItems && (cst.childItems as ChildItems)?.length > 0) {
    return
  }

  cst.childItems = element.childItems.map((child) => parseElement(context, child)) || []
}

export const parseAutoCommandBar = (context: ConfigurationContext, element: TreeNode): AutoCommandBar => {
  const ast = elementsParser.parseAutoCommandBar(element.tokens)
  const cst = visitor.visit(ast, context)
  return cst
}

const parseByElementType = (element: TreeNode): CstNode => {
  switch (element.type) {
    case ParseElementType.LabelDecoration:
      return elementsParser.parseLabelDecoration(element.tokens)
    case ParseElementType.InputField:
      return elementsParser.parseInputField(element.tokens)
    case ParseElementType.Button:
      return elementsParser.parseButton(element.tokens)
    case ParseElementType.RightTitledCheckboxField:
      return elementsParser.parseRightTitledCheckboxField(element.tokens)
    case ParseElementType.LeftTitledCheckboxField:
      return elementsParser.parseLeftTitledCheckboxField(element.tokens)
    case ParseElementType.RadioButtonField:
      return elementsParser.parseRadioButtonField(element.tokens)
    case ParseElementType.CommandBar:
      return elementsParser.parseCommandBar(element.tokens)
    case ParseElementType.Table:
      return elementsParser.parseTable(element.tokens)
    case ParseElementType.Pages:
      return elementsParser.parsePages(element.tokens)
    case ParseElementType.Page:
      return elementsParser.parsePage(element.tokens)
    case ParseElementType.VerticalGroup:
      return elementsParser.parseVerticalGroup(element.tokens)
    case ParseElementType.HorizontalGroup:
      return elementsParser.parseHorizontalGroup(element.tokens)
    case ParseElementType.OneLineGroup:
      return elementsParser.parseOneLineGroup(element.tokens)
    case ParseElementType.PictureDecoration:
      return elementsParser.parsePictureDecoration(element.tokens)
    case ParseElementType.OtherField:
      return elementsParser.parseOtherField(element.tokens)
    default:
      throw new Error(`Unknown element type: ${element.type}`)
  }
}
