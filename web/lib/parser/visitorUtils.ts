import { CstElement, IToken } from "chevrotain"

export function joinTokens(tokens: CstElement[]): string | undefined {
  if (tokens === undefined) {
    return undefined
  }
  return (tokens as IToken[])
    .map((token) => token.image)
    .join("")
    .trim()
}
