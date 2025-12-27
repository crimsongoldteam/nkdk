import type { CstElement, CstNode, IToken } from "chevrotain"

export function joinTokens(tokens: { image: string }[]): string | undefined {
  if (tokens === undefined) {
    return undefined
  }
  return (tokens as IToken[])
    .map((token) => token.image)
    .join("")
    .trim()
}

export function visitAll(visitor: any, ctx: CstElement[], param?: any): CstNode[] {
  if (!ctx) {
    return []
  }
  return ctx.map((item) => visitor.visit(item, param))
}
