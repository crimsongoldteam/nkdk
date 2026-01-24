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
          const quote = image[0]
          // For EscapedText, preserve empty string content (don't trim the content itself)
          let content = image.slice(1, -1)
          return unescapeText(content, quote)
        }
        // If no outer quotes, still try to convert doubled quotes (in case tokenizer already stripped them)
        return unescapeText(image, '"')
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

/**
 * Обрабатывает escape-последовательности в строке.
 * Поддерживает doubled quotes (для " и ') и backslash escapes (\n, \t, \r, \\, \", \', \uXXXX, \xXX).
 */
export function unescapeText(content: string, quote: string): string {
  // 1. Обрабатываем удвоенные кавычки (например, "" -> ")
  const doubledQuote = quote + quote
  let result = content.replace(new RegExp(doubledQuote, "g"), quote)

  // 2. Обрабатываем backslash escapes
  return result.replace(/\\(n|t|r|\\|"|'|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{2})/g, (match, p1) => {
    switch (p1) {
      case "n":
        return "\n"
      case "t":
        return "\t"
      case "r":
        return "\r"
      case "\\":
        return "\\"
      case '"':
        return '"'
      case "'":
        return "'"
      default:
        if (p1.startsWith("u")) return String.fromCharCode(parseInt(p1.slice(1), 16))
        if (p1.startsWith("x")) return String.fromCharCode(parseInt(p1.slice(1), 16))
        return match
    }
  })
}
