import { ConfigurationContext } from "~/metadata/context/types"
import { parseAutoCommandBar, parseElement } from "./parser/elementsParser/parse"
import { tokenize } from "./parser/tokenizer/tokenizer"
import { parseTree } from "./parser/treeParser/treeParser"
import { ParseElementType, TreeNode } from "./parser/treeParser/types"
import { ChildItemsStructureResult } from "./types"

export const importChildItemsFromStructure = (
  context: ConfigurationContext,
  text: string
): ChildItemsStructureResult => {
  const tokens = tokenize(text)
  const treeNodes = parseTree(context, tokens)

  const { autoCommandBar: autoCommandBarNode, childItems: childItemsNodes } =
    pickAutoCommandBarFromChildItems(treeNodes)

  const autoCommandBar = autoCommandBarNode ? parseAutoCommandBar(context, autoCommandBarNode) : undefined

  const childItems = childItemsNodes.map((node) => parseElement(context, node))

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
  const result: PickAutoCommandBarResult = {
    childItems: [],
  }

  for (const childItem of treeNodes) {
    if (childItem.type === ParseElementType.AutoCommandBar) {
      result.autoCommandBar = childItem
      continue
    }

    result.childItems.push(childItem)
  }

  return result
}
