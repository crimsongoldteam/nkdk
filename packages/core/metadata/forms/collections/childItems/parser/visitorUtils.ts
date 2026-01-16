import type { CstElement, CstNode, IToken } from "chevrotain"

export function joinTokens(tokens: { image: string }[]): string | undefined {
  if (tokens === undefined || tokens.length === 0) {
    return undefined
  }
  const result = (tokens as IToken[])
    .map((token) => {
      // Handle EscapedText tokens: strip quotes from the image
      if ((token as IToken).tokenType?.name === "EscapedText") {
        const image = token.image.trim()
        // Remove leading and trailing quotes (single or double)
        if ((image.startsWith('"') && image.endsWith('"')) || (image.startsWith("'") && image.endsWith("'"))) {
          // For EscapedText, preserve empty string content (don't trim the content itself)
          const content = image.slice(1, -1)
          return content
        }
      }
      return token.image
    })
    .join("")
    .trim()

  return result
}

export function visitAll(visitor: any, ctx: CstElement[], param?: any): CstNode[] {
  if (!ctx) {
    return []
  }
  return ctx.map((item) => visitor.visit(item, param))
}
