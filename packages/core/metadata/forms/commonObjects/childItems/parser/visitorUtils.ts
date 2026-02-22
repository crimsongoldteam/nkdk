import type { CstElement, CstNode, IToken } from "chevrotain"

export function joinTokens(tokens: { image: string }[]): string | undefined {
  if (tokens === undefined || tokens.length === 0) {
    return undefined
  }
  const result = (tokens as IToken[])
    .map((token) => {
      // Handle EscapedText tokens: strip quotes from the image and convert doubled quotes
      if ((token as IToken).tokenType?.name === "EscapedText") {
        return unescapeText(token.image.trim())
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

const ESC_RE = /\\(n|t|r|\\|"|'|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{2})/g
const ESC: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"', "'": "'" }

/** Escape-последовательности: снятие кавычек, ""/'' → одна кавычка, \\n \\t \\r \\ \\" \\' \\uXXXX \\xXX */
export function unescapeText(content: string): string {
  let s = content
  if (content.length >= 2) {
    const q = content[0]
    if ((q === '"' || q === "'") && content[content.length - 1] === q) s = content.slice(1, -1)
  }
  s = s.replace(/""|''/g, (m) => m[0])
  return s.replace(ESC_RE, (_, p1) => ESC[p1] ?? (p1[0] === "u" ? String.fromCharCode(parseInt(p1.slice(1), 16)) : p1[0] === "x" ? String.fromCharCode(parseInt(p1.slice(1), 16)) : "\\" + p1))
}
