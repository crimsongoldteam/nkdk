import { IToken } from "chevrotain"
import { TElementType } from "~/lib/metadata/forms/elements/types"
import { detectElementType } from "./detect"
import { lexer } from "./lexer"
import { TreeNode } from "./parseTree"

export interface DetectedTreeNode {
  tokens: IToken[]
  type: TElementType
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
