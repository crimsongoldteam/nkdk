import type { CstNode } from "chevrotain"
import type { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import type { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import type { DetectedTreeNode } from "../treeParser/detectTree"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"

export const parseElement = (
  element: DetectedTreeNode,
  configurationSettings: TConfigurationSettings
): TBaseElement => {
  const ast = parseByElementType(element)

  const cst = visitor.visit(ast, configurationSettings)

  return cst
}

const parseByElementType = (element: DetectedTreeNode): CstNode => {
  switch (element.type) {
    case ZElementType.enum.LabelDecoration:
      return elementsParser.parseLabelDecoration(element.tokens)
    case ZElementType.enum.InputField:
      return elementsParser.parseInputField(element.tokens)
    default:
      throw new Error(`Unknown element type: ${element.type}`)
  }
}
