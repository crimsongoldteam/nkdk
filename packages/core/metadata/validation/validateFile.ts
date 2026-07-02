import { TSchema } from "@sinclair/typebox"
import { TypeCheck } from "@sinclair/typebox/compiler"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { typeboxErrorsToDiagnostics } from "./typeboxErrorsToDiagnostics"
import { Diagnostic } from "./types"

export interface ValidateFileParams {
  filePath: string
  text: string
  schema: TypeCheck<TSchema>
}

export interface ValidateParsedFileParams {
  filePath: string
  parsed: ParsedYaml
  schema: TypeCheck<TSchema>
}

export function validateFile({ filePath, text, schema }: ValidateFileParams): Diagnostic[] {
  const parsed = parseMetadataYaml(text)

  return validateParsedFile({ filePath, parsed, schema })
}

export function validateParsedFile({ filePath, parsed, schema }: ValidateParsedFileParams): Diagnostic[] {
  // Short-circuit: при синтаксической ошибке TypeBox и external-file не запускаются
  if (parsed.syntaxErrors.length > 0) {
    return parsed.syntaxErrors.map((error) => ({
      filePath,
      line: error.line,
      col: error.col,
      message: error.message,
      severity: "error" as const,
      source: "syntax" as const,
    }))
  }

  // Структурная валидация через TypeBox
  if (!schema.Check(parsed.data)) {
    const errors = [...schema.Errors(parsed.data)]
    return typeboxErrorsToDiagnostics(errors, parsed, filePath, schema)
  }

  return []
}
