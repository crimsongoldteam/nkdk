import { IToken } from "chevrotain"
import { TElementType } from "~/lib/metadata/forms/elements/types"
import { DetectedTreeNode } from "../parser/treeParser/detectTree"

export type TSimplifyToken = { type: string; value: string }

export type SimplifiedDetectedTreeNode = {
  tokens: TSimplifyToken[]
  type: TElementType
  childItems: SimplifiedDetectedTreeNode[]
}

export const simlifyDetectedTreeNodes = (
  nodes: DetectedTreeNode[]
): SimplifiedDetectedTreeNode[] => {
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
