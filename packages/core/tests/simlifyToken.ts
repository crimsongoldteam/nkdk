import { IToken } from "chevrotain"
import { ParseElementType, TreeNode } from "~/metadata/forms/collections/childItems/parser/treeParser/types"
export type TSimplifyToken = { type: string; value: string }

export type SimplifiedDetectedTreeNode = {
  tokens: TSimplifyToken[]
  type: ParseElementType
  childItems: SimplifiedDetectedTreeNode[]
}

export const simlifyDetectedTreeNodes = (nodes: TreeNode[]): SimplifiedDetectedTreeNode[] => {
  return nodes.map((node) => {
    // Упрощаем токены текущего узла
    const simplifiedTokens = node.tokens.map((token) => simplifyToken(token))

    // Рекурсивно обрабатываем дочерние элементы
    const simplifiedChildItems = simlifyDetectedTreeNodes(node.childItems)

    return {
      tokens: simplifiedTokens,
      type: node.type,
      childItems: simplifiedChildItems,
    }
  })
}

const simplifyToken = (token: IToken): TSimplifyToken => {
  return { type: token.tokenType.name, value: token.image }
}
