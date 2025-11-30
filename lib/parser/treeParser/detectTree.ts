import type { IToken } from "chevrotain"
import type { ParseElementType } from "../types"
import { detectElementType } from "./detect"
import { lexer } from "./lexer"
import type { TreeNode } from "./parseTree"

export interface DetectedTreeNode {
  tokens: IToken[]
  type: ParseElementType
  childItems: DetectedTreeNode[]
}

export const detectTreeNodes = (nodes: TreeNode[]): DetectedTreeNode[] => {
  return nodes.map((node) => {
    const tokens = lexer.tokenize(node.content).tokens

    const type = detectElementType(tokens)

    const childItems = node.childItems ? detectTreeNodes(node.childItems) : []

    return {
      tokens,
      type,
      childItems,
    }
  })
}
