import { IToken } from "chevrotain"
import { describe, expect, it } from "vitest"
import { lexer } from "./lexer"

describe("lexer", () => {
  it("should lex input field containing :", () => {
    const mock = `text:`

    const expectedResult = [
      { type: "Text", value: "text" },
      { type: "Colon", value: ":" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })
})

const simplifyTokens = (tokens: IToken[]) => {
  return tokens.map((token) => {
    return {
      type: token.tokenType.name,
      value: token.image,
    }
  })
}
