import { Lexer } from "chevrotain"
import { multiModeLexerDefinition } from "~/parser/lexer"
import { Context } from "../../context/types"
import { compactObject } from "../../helpers/compactObject"
import { TypeDescriptionParser } from "./parser/parser"
import { TypeDescriptionVisitor } from "./parser/visitor"
import { TypeDescription } from "./types"

export const importTypeDescriptionFromEnterprise = (
  _context: Context,
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

  // Удаляем дефолтные квалификаторы
  const cleanedResult = { ...result }

  // Удаляем stringQualifiers, если они равны дефолтным значениям
  if (
    cleanedResult.stringQualifiers &&
    cleanedResult.stringQualifiers.length === 0 &&
    cleanedResult.stringQualifiers.allowedLength === "Variable"
  ) {
    cleanedResult.stringQualifiers = undefined
  }

  // Удаляем numberQualifiers, если они равны дефолтным значениям
  if (
    cleanedResult.numberQualifiers &&
    cleanedResult.numberQualifiers.digits === 0 &&
    cleanedResult.numberQualifiers.fractionDigits === 0 &&
    cleanedResult.numberQualifiers.allowedSign === undefined
  ) {
    cleanedResult.numberQualifiers = undefined
  }

  // Не удаляем dateQualifiers, так как они нужны для различения типов дат

  return compactObject(cleanedResult)
}
