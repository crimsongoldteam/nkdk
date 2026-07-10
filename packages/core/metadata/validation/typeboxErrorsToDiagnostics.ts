import type { ValidationSchemaValidator } from "./compileValidationSchema"
import type { TSchema } from "typebox"
import { ParsedYaml } from "../../yaml/parseMetadataYaml"
import { Diagnostic } from "./types"
import { diagnosticAtYamlPath } from "./yamlLocations"

export type ValidationError = {
  keyword: string
  schemaPath: string
  instancePath: string
  params: Record<string, unknown>
  message: string
  schema?: TSchema
  value?: unknown
  diagnosticLocation?: "key"
}

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
  if (Array.isArray(required)) return required.filter((item): item is string => typeof item === "string")

  const missing = (error.params as { missingProperty?: unknown }).missingProperty
  return typeof missing === "string" ? [missing] : []
}

function additionalPropertyNames(error: ValidationError): string[] {
  const additional = (error.params as { additionalProperties?: unknown }).additionalProperties
  if (Array.isArray(additional)) return additional.filter((item): item is string => typeof item === "string")

  const property = (error.params as { additionalProperty?: unknown }).additionalProperty
  return typeof property === "string" ? [property] : []
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
  if (error.keyword === "oneOf") return error.message === "must match exactly one schema in oneOf" ? "Expected union value" : error.message
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

    if (error.keyword === "discriminator") {
      const tag = (error.params as { tag?: unknown }).tag
      result.push({
        ...error,
        instancePath:
          typeof tag === "string" ? `${error.instancePath}/${escapeJsonPointerSegment(tag)}` : error.instancePath,
      })
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
  _schema?: ValidationSchemaValidator<TSchema>
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const expandedErrors = normalizedErrors(errors)
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
