import type { CstNode } from "chevrotain"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import type { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import type { DetectedTreeNode } from "../detector/detectTree"
import { ParseElementType } from "../types"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"

export const parseElement = (
  element: DetectedTreeNode,
  configurationSettings: TConfigurationSettings
): TBaseElement => {
  const ast = parseByElementType(element)

  const cst = visitor.visit(ast, configurationSettings)

  // Обрабатываем childItems рекурсивно
  addChildItemsToResult(cst, element, configurationSettings)

  return cst
}

const addChildItemsToResult = (
  cst: TBaseElement,
  element: DetectedTreeNode,
  configurationSettings: TConfigurationSettings
): void => {
  // Добавляем childItems к результату, если элемент поддерживает их
  if (!("childItems" in cst)) return

  cst.childItems =
    element.childItems?.map((child) =>
      parseElement(child, configurationSettings)
    ) || []
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
