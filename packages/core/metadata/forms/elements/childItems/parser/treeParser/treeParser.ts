import { IToken } from "chevrotain"
import { parseOneLineGroupElements } from "../elementsParser/parse"
import { detectElementType } from "./detector"
import { buildTree } from "./treeBuilder"
import { BuilderTreeNode, ElementWithChildItems, ParseElementType, TreeNode } from "./types"

export const parseTree = (tokens: IToken[]): TreeNode[] => {
  const tree = buildTree(tokens)
  return processTreeNodes(tree)
}

const processTreeNodes = (builderNodes: BuilderTreeNode[]): TreeNode[] => {
  return builderNodes.flatMap((node) => processBuilderTree(node))
}

const processBuilderTree = (builderNode: BuilderTreeNode): TreeNode[] => {
  const type = detectElementType(builderNode.tokens)

  const currentTreeNode: TreeNode =
    type === ParseElementType.OneLineGroup
      ? processOneLineGroup(builderNode)
      : {
          tokens: builderNode.tokens,
          type,
          childItems: [],
        }

  const result: TreeNode[] = [currentTreeNode]

  let canHaveChildItems = true

  for (const builderChild of builderNode.childItems) {
    const childTreeNodes = processBuilderTree(builderChild)

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

const processOneLineGroup = (builderNode: BuilderTreeNode): TreeNode => {
  const type = detectElementType(builderNode.tokens)

  const { group, elements } = parseOneLineGroupElements(builderNode)

  return {
    tokens: group,
    type,
    childItems: processTreeNodes(elements.map((element) => ({ tokens: element, childItems: [] }))),
  }
}

const canBeChildItem = (parentNodeType: ParseElementType, _childNodeType: ParseElementType): boolean => {
  return ElementWithChildItems.includes(parentNodeType)
}
