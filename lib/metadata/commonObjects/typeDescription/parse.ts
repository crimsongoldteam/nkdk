import { Lexer } from "chevrotain"
import { multiModeLexerDefinition } from "~/lib/parser/lexer"
import { TypeDescriptionParser } from "./parser/parser"
import { TypeDescriptionVisitor } from "./parser/visitor"
import { TypeDescription } from "./types"

export const parseTypeDescription = (
  value: string | undefined
): TypeDescription | undefined => {
  if (value === undefined || value.trim() === "") {
    return undefined
  }

  const lexer = new Lexer(multiModeLexerDefinition)
  const lexingResult = lexer.tokenize(value, "properties_mode")

  if (lexingResult.errors.length > 0) {
    return undefined
  }

  const parser = new TypeDescriptionParser()
  parser.input = lexingResult.tokens

  const cst = parser.parseTypeDescription()

  if (!cst) {
    return undefined
  }

  const visitor = new TypeDescriptionVisitor()
  const result = visitor.visit(cst) as TypeDescription

  return result
}
