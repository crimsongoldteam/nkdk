import { IToken } from "chevrotain"
import { detectElementType } from "./detector"
import { buildTree } from "./treeBuilder"
import { BuilderTreeNode, ElementWithChildItems, ParseElementType, TreeNode } from "./types"

export const parseTree = (tokens: IToken[]): TreeNode[] => {
  const tree = buildTree(tokens)
  return tree.flatMap((node) => convertBuilderNodeToTreeNode(node))
}

const convertBuilderNodeToTreeNode = (builderNode: BuilderTreeNode): TreeNode[] => {
  const type = detectElementType(builderNode.tokens)

  const currentTreeNode: TreeNode = {
    tokens: builderNode.tokens,
    type,
    childItems: [],
  }

  const result: TreeNode[] = [currentTreeNode]

  let canHaveChildItems = true

  for (const builderChild of builderNode.childItems) {
    const childTreeNodes = convertBuilderNodeToTreeNode(builderChild)

    for (const childTreeNode of childTreeNodes) {
      if (canHaveChildItems && canBeChildItem(type, childTreeNode.type)) {
        currentTreeNode.childItems.push(childTreeNode)
      } else {
        result.push(childTreeNode)
        canHaveChildItems = false
      }
    }
  }

  return result
}

const canBeChildItem = (parentNodeType: ParseElementType, _childNodeType: ParseElementType): boolean => {
  return ElementWithChildItems.includes(parentNodeType)
}
