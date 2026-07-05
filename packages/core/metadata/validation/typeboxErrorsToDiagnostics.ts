import type { ValidationSchemaValidator } from "./compileValidationSchema"
import type { TSchema } from "typebox"
import { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { expandDiscriminatedUnionErrors, type ValidationError } from "./discriminatedUnionErrors"
import { Diagnostic } from "./types"
import { diagnosticAtYamlPath } from "./yamlLocations"

function parseJsonPointer(pointer: string): (string | number)[] {
  if (!pointer || pointer === "/") return []
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => {
      const decoded = segment.replace(/~1/g, "/").replace(/~0/g, "~")
      return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded
    })
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1")
}

function requiredPropertyNames(error: ValidationError): string[] {
  const required = (error.params as { requiredProperties?: unknown }).requiredProperties
  return Array.isArray(required) ? required.filter((item): item is string => typeof item === "string") : []
}

function additionalPropertyNames(error: ValidationError): string[] {
  const additional = (error.params as { additionalProperties?: unknown }).additionalProperties
  return Array.isArray(additional) ? additional.filter((item): item is string => typeof item === "string") : []
}

function diagnosticMessage(error: ValidationError, keys: (string | number)[]): string {
  if (error.keyword === "required" && keys.length > 0) {
    return `Отсутствует обязательное свойство "${String(keys[keys.length - 1])}"`
  }
  if (error.keyword === "type") {
    const type = (error.params as { type?: unknown }).type
    if (type === "number") return "Expected number"
    if (type === "string") return "Expected string"
  }
  if (error.keyword === "anyOf") return error.message === "must match a schema in anyOf" ? "Expected union value" : error.message
  return error.message
}

function normalizedErrors(errors: ValidationError[]): ValidationError[] {
  const result: ValidationError[] = []

  for (const error of errors) {
    if (error.keyword === "required") {
      const names = requiredPropertyNames(error)
      if (names.length === 0) {
        result.push(error)
      } else {
        for (const name of names) {
          result.push({
            ...error,
            instancePath: `${error.instancePath}/${escapeJsonPointerSegment(name)}`,
          })
        }
      }
      continue
    }

    if (error.keyword === "additionalProperties") {
      const names = additionalPropertyNames(error)
      if (names.length === 0) {
        result.push(error)
      } else {
        for (const name of names) {
          result.push({
            ...error,
            instancePath: `${error.instancePath}/${escapeJsonPointerSegment(name)}`,
          })
        }
      }
      continue
    }

    result.push(error)
  }

  return result
}

export function typeboxErrorsToDiagnostics(
  errors: ValidationError[],
  parsed: ParsedYaml,
  filePath: string,
  schema?: ValidationSchemaValidator<TSchema>
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const expandedErrors = normalizedErrors(expandDiscriminatedUnionErrors(errors, schema))
  const missingRequiredPaths = new Set(
    expandedErrors.filter((error) => error.keyword === "required").map((error) => error.instancePath)
  )

  for (const error of expandedErrors) {
    if (error.keyword !== "required" && missingRequiredPaths.has(error.instancePath)) continue

    const pointer = error.instancePath
    const keys = parseJsonPointer(pointer)

    if (error.diagnosticLocation === "key") {
      diagnostics.push(
        diagnosticAtYamlPath({
          filePath,
          parsed,
          path: keys,
          message: diagnosticMessage(error, keys),
          severity: "error",
          source: "structure",
        })
      )
      continue
    }

    const isRequired = error.keyword === "required"
    const lookupKeys = isRequired && keys.length > 0 ? keys.slice(0, -1) : keys

    const position =
      (isRequired
        ? parsed.locations.nodePosition(lookupKeys)
        : (parsed.locations.valuePosition(lookupKeys) ?? parsed.locations.nodePosition(lookupKeys))) ??
      (lookupKeys.length === 0 ? parsed.locations.rootPosition() : { line: 1, col: 1 })

    diagnostics.push({
      filePath,
      line: position.line,
      col: position.col,
      message: diagnosticMessage(error, keys),
      severity: "error",
      source: "structure",
      path: pointer || undefined,
    })
  }

  return diagnostics
}
