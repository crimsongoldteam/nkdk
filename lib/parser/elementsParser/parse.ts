import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { DetectedTreeNode } from "../treeParser/detectTree"
import { elementsParser } from "./parser"
import { visitor } from "./visitor"

export const parseElement = (element: DetectedTreeNode): TBaseElement => {
  const methodName = ("parse" + element.type) as keyof typeof elementsParser
  const ast = elementsParser[methodName](element.tokens)

  const cst = visitor.visit(ast)

  return cst
}
