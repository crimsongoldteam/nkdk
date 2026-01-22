import { ConfigurationContext } from "~/metadata/context/types"
import { parseAutoCommandBar, parseElement } from "./parser/elementsParser/parse"
import { tokenize } from "./parser/tokenizer/tokenizer"
import { parseTree } from "./parser/treeParser/treeParser"
import { ParseElementType, TreeNode } from "./parser/treeParser/types"
import { ChildItemsStructureResult, GroupChildItems } from "./types"

export const importChildItemsFromStructure = (
  context: ConfigurationContext,
  text: string
): ChildItemsStructureResult => {
  const tokens = tokenize(text)
  const treeNodes = parseTree(context, tokens)

  const { autoCommandBar: autoCommandBarNode, childItems: childItemsNodes } =
    pickAutoCommandBarFromChildItems(treeNodes)

  const autoCommandBar = autoCommandBarNode ? parseAutoCommandBar(context, autoCommandBarNode) : undefined

  const childItems = childItemsNodes.map((node) => parseElement(context, node)) as GroupChildItems

  return {
    childItems,
    autoCommandBar,
  }
}

interface PickAutoCommandBarResult {
  autoCommandBar?: TreeNode
  childItems: TreeNode[]
}

const pickAutoCommandBarFromChildItems = (treeNodes: TreeNode[]): PickAutoCommandBarResult => {
  if (treeNodes.length > 0) {
    const firstNode = treeNodes[0]
    if (firstNode.type === ParseElementType.AutoCommandBar) {
      return {
        autoCommandBar: firstNode,
        childItems: treeNodes.slice(1),
      }
    }
  }

  return {
    autoCommandBar: undefined,
    childItems: treeNodes,
  }
}
