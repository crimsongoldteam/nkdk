import { TSchema } from "@sinclair/typebox"
import { TypeCheck, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"
import { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { expandDiscriminatedUnionErrors } from "./discriminatedUnionErrors"
import { Diagnostic } from "./types"
import { diagnosticAtYamlPath } from "./yamlLocations"

function parseJsonPointer(pointer: string): (string | number)[] {
  if (!pointer || pointer === "/") return []
  return pointer
    .slice(1) // удалить ведущий /
    .split("/")
    .map((segment) => {
      const decoded = segment.replace(/~1/g, "/").replace(/~0/g, "~")
      return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded
    })
}

function isDiagnosticAtKey(error: ValueError): boolean {
  return error.type === ValueErrorType.ObjectAdditionalProperties && error.schema.diagnosticLocation === "key"
}

export function typeboxErrorsToDiagnostics(
  errors: ValueError[],
  parsed: ParsedYaml,
  filePath: string,
  schema?: TypeCheck<TSchema>
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const expandedErrors = expandDiscriminatedUnionErrors(errors, schema)
  const missingRequiredPaths = new Set(
    expandedErrors.filter((error) => error.type === ValueErrorType.ObjectRequiredProperty).map((error) => error.path)
  )

  for (const error of expandedErrors) {
    if (error.type !== ValueErrorType.ObjectRequiredProperty && missingRequiredPaths.has(error.path)) continue

    const pointer = error.path
    const keys = parseJsonPointer(pointer)

    if (isDiagnosticAtKey(error)) {
      diagnostics.push(
        diagnosticAtYamlPath({
          filePath,
          parsed,
          path: keys,
          message: error.message,
          severity: "error",
          source: "structure",
        })
      )
      continue
    }

    // Для отсутствующего обязательного поля берём координаты родительского узла
    const isRequired = error.type === ValueErrorType.ObjectRequiredProperty
    const lookupKeys = isRequired && keys.length > 0 ? keys.slice(0, -1) : keys

    const position =
      (isRequired
        ? parsed.locations.nodePosition(lookupKeys)
        : (parsed.locations.valuePosition(lookupKeys) ?? parsed.locations.nodePosition(lookupKeys))) ??
      (lookupKeys.length === 0 ? parsed.locations.rootPosition() : { line: 1, col: 1 })
    const line = position.line
    const col = position.col

    diagnostics.push({
      filePath,
      line,
      col,
      message:
        error.type === ValueErrorType.ObjectRequiredProperty && keys.length > 0
          ? `Отсутствует обязательное свойство "${String(keys[keys.length - 1])}"`
          : error.message,
      severity: "error",
      source: "structure",
      path: pointer || undefined,
    })
  }

  return diagnostics
}
