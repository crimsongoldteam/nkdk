import { CstElement, CstNode, IToken } from "chevrotain"
import { Visitor } from "./visitor"

export function joinTokens(tokens: CstElement[]): string | undefined {
  if (tokens === undefined) {
    return undefined
  }
  return (tokens as IToken[])
    .map((token) => token.image)
    .join("")
    .trim()
}

export function visitAll(visitor: Visitor, ctx: CstElement[], param?: any): CstNode[] {
  if (!ctx) {
    return []
  }
  return (ctx as CstNode[]).map((item) => visitor.visit(item, param))
}
