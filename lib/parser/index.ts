import { IToken, Lexer, CstNode } from "chevrotain"
import { Parser } from "./parser"
import { multiModeLexerDefinition } from "./lexer"

const lexer = new Lexer(multiModeLexerDefinition)
const parser = new Parser()

export function parseString(text: string, initToken?: IToken): CstNode[] {
  const lexingResult = lexer.tokenize(text)
  const tokens = initToken ? [initToken, ...lexingResult.tokens] : lexingResult.tokens
  return parse(tokens)
}

export function parse(tokens: IToken[]): CstNode[] {
  return parser.parseFields(tokens)
}
