// import { IToken } from "chevrotain"
// import type { ConfigurationContext } from "~/metadata/context/types"
// import { parseOneLineGroupElements } from "../elementsParser/parse"
// import { detectElementType } from "./detector"
// import { buildTree } from "./treeBuilder"
// import { BuilderTreeNode, ElementWithChildItems, ParseElementType, TreeNode } from "./types"

// export const parseTree = (
//   context: ConfigurationContext,
//   tokens: IToken[],
//   partialParse: boolean = false
// ): TreeNode[] => {
//   const builderNodes = buildTree(tokens)

//   const flatten = processTreeNodes(context, builderNodes)

//   if (!partialParse && flatten.length > 0 && flatten[0].type === ParseElementType.PotentialAutoCommandBar) {
//     flatten[0].type = ParseElementType.AutoCommandBar
//   }

//   const result = processTableAutoCommandBar(flatten)

//   return result
// }

// const processTreeNodes = (context: ConfigurationContext, builderNodes: BuilderTreeNode[]): TreeNode[] => {
//   return builderNodes.flatMap((node) => processBuilderTree(context, node))
// }

// const processBuilderTree = (context: ConfigurationContext, builderNode: BuilderTreeNode): TreeNode[] => {
//   const type = detectElementType(builderNode.tokens)

//   const currentTreeNode: TreeNode =
//     type === ParseElementType.OneLineHorizontalGroup
//       ? processOneLineGroup(context, builderNode)
//       : {
//           tokens: builderNode.tokens,
//           type,
//           childItems: [],
//         }

//   const result: TreeNode[] = [currentTreeNode]

//   let canHaveChildItems = true

//   for (const builderChild of builderNode.childItems) {
//     const childTreeNodes = processBuilderTree(context, builderChild)

//     for (const childTreeNode of childTreeNodes) {
//       if (canHaveChildItems && canBeChildItem(type, childTreeNode.type)) {
//         currentTreeNode.childItems.push(childTreeNode)
//       } else {
//         result.push(childTreeNode)
//         canHaveChildItems = false
//       }
//     }
//   }

//   return result
// }

// const processOneLineGroup = (context: ConfigurationContext, builderNode: BuilderTreeNode): TreeNode => {
//   const type = detectElementType(builderNode.tokens)

//   const { group, elements } = parseOneLineGroupElements(context, builderNode)

//   return {
//     tokens: group,
//     type,
//     childItems: processTreeNodes(
//       context,
//       elements.map((element) => ({ tokens: element, childItems: [] }))
//     ),
//   }
// }

// const canBeChildItem = (parentNodeType: ParseElementType, _childNodeType: ParseElementType): boolean => {
//   return ElementWithChildItems.includes(parentNodeType)
// }

// const processTableAutoCommandBar = (tree: TreeNode[]): TreeNode[] => {
//   const result: TreeNode[] = []
//   let i = 0
//   while (i < tree.length) {
//     const node = tree[i]
//     const nextNode = tree[i + 1]
//     i++

//     if (node.type === ParseElementType.PotentialAutoCommandBar) {
//       if (nextNode?.type === ParseElementType.Table) {
//         nextNode.autoCommandBar = {
//           tokens: node.tokens,
//           type: ParseElementType.AutoCommandBar,
//           childItems: [],
//         }
//         continue
//       }

//       result.push({
//         tokens: node.tokens,
//         type: ParseElementType.CommandBar,
//         childItems: [],
//       })

//       continue
//     }

//     // Рекурсивно обрабатываем childItems
//     const processedNode: TreeNode = {
//       ...node,
//       childItems: processTableAutoCommandBar(node.childItems),
//     }

//     result.push(processedNode)
//   }

//   return result
// }
