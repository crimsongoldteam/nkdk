import { IToken } from "chevrotain"
import type { ConfigurationContext } from "~/metadata/context/types"
import { parseOneLineGroupElements } from "../elementsParser/parse"
import { detectElementType } from "./detector"
import { buildTree } from "./treeBuilder"
import { BuilderTreeNode, ElementWithChildItems, ParseElementType, TreeNode } from "./types"

export const parseTree = (context: ConfigurationContext, tokens: IToken[]): TreeNode[] => {
  const tree = buildTree(tokens)
  return processTreeNodes(context, tree)
}

const processTreeNodes = (context: ConfigurationContext, builderNodes: BuilderTreeNode[]): TreeNode[] => {
  return builderNodes.flatMap((node) => processBuilderTree(context, node))
}

const processBuilderTree = (context: ConfigurationContext, builderNode: BuilderTreeNode): TreeNode[] => {
  const type = detectElementType(builderNode.tokens)

  const currentTreeNode: TreeNode =
    type === ParseElementType.OneLineGroup
      ? processOneLineGroup(context, builderNode)
      : {
          tokens: builderNode.tokens,
          type,
          childItems: [],
        }

  const result: TreeNode[] = [currentTreeNode]

  let canHaveChildItems = true

  for (const builderChild of builderNode.childItems) {
    const childTreeNodes = processBuilderTree(context, builderChild)

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

const processOneLineGroup = (context: ConfigurationContext, builderNode: BuilderTreeNode): TreeNode => {
  const type = detectElementType(builderNode.tokens)

  // Создаем временный TreeNode для вызова parseOneLineGroupElements
  const temporaryTreeNode: TreeNode = {
    tokens: builderNode.tokens,
    type,
    childItems: [],
  }

  const { group, elements } = parseOneLineGroupElements(context, temporaryTreeNode)

  return {
    tokens: group,
    type,
    childItems: processTreeNodes(
      context,
      elements.map((element) => ({ tokens: element, childItems: [] }))
    ),
  }
}

const canBeChildItem = (parentNodeType: ParseElementType, _childNodeType: ParseElementType): boolean => {
  return ElementWithChildItems.includes(parentNodeType)
}
