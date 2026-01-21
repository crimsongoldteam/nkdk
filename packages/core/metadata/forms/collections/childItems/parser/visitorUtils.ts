import type { CstElement, CstNode, IToken } from "chevrotain"

export function joinTokens(tokens: { image: string }[]): string | undefined {
  if (tokens === undefined || tokens.length === 0) {
    return undefined
  }
  const result = (tokens as IToken[])
    .map((token) => {
      // Handle EscapedText tokens: strip quotes from the image and convert doubled quotes
      if ((token as IToken).tokenType?.name === "EscapedText") {
        let image = token.image.trim()
        // Remove leading and trailing quotes (single or double)
        if ((image.startsWith('"') && image.endsWith('"')) || (image.startsWith("'") && image.endsWith("'"))) {
          // For EscapedText, preserve empty string content (don't trim the content itself)
          let content = image.slice(1, -1)
          // Convert doubled quotes "" to single quote " (format uses doubled quotes for escaping)
          content = content.replace(/""/g, '"')
          return content
        }
        // If no outer quotes, still try to convert doubled quotes (in case tokenizer already stripped them)
        return image.replace(/""/g, '"')
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
