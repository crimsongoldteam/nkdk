import type { CstNode } from "chevrotain"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ChildItems } from "~/metadata/forms/elements/childItems/types"
import type { DetectedTreeNode } from "../detector/detectTree"
import { ParseElementType } from "../types"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"

export const parseElement = (element: DetectedTreeNode, context: ConfigurationContext): BaseElement => {
  const ast = parseByElementType(element)

  const cst = visitor.visit(ast, context)

  // Обрабатываем childItems рекурсивно
  addChildItemsToResult(cst, element, context)

  return cst
}

const addChildItemsToResult = (cst: BaseElement, element: DetectedTreeNode, context: ConfigurationContext): void => {
  if (!("childItems" in cst)) return

  if (element.type === ParseElementType.CommandBar) return

  // Для таблицы childItems уже установлены в visitor из ячеек первой строки
  // Не перезаписываем их, если они уже есть
  if (element.type === ParseElementType.Table && cst.childItems && (cst.childItems as ChildItems)?.length > 0) {
    return
  }

  cst.childItems = element.childItems?.map((child) => parseElement(child, context)) || []
}

const parseByElementType = (element: DetectedTreeNode): CstNode => {
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
    default:
      throw new Error(`Unknown element type: ${element.type}`)
  }
}
