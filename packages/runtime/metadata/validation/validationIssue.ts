import type { ValidationSchemaError } from "./validationSchema"

export type ValidationIssuePath = readonly (string | number)[]

export type ValidationIssueTarget =
  | { readonly kind: "path"; readonly path: ValidationIssuePath }
  | { readonly kind: "missing"; readonly path: ValidationIssuePath }
  | { readonly kind: "occurrence"; readonly path: ValidationIssuePath; readonly occurrence: number }

export interface ValidationIssue {
  readonly code: string
  readonly kind: "semantic" | "infrastructure"
  readonly target: ValidationIssueTarget
  readonly relatedPaths?: readonly ValidationIssuePath[]
  readonly params?: Readonly<Record<string, unknown>>
}

export function typeboxErrorsToValidationIssues(
  errors: readonly ValidationSchemaError[],
  basePath: ValidationIssuePath = [],
): ValidationIssue[] {
  return unambiguousValidationErrors(errors)
    .flatMap((error) => issuesForTypeboxError(error, basePath))
}

export function unambiguousValidationErrors(
  errors: readonly ValidationSchemaError[],
): ValidationSchemaError[] {
  const unions = errors.filter(({ keyword }) => keyword === "anyOf" || keyword === "oneOf")
  return errors.filter((error) => !unions.some((union) =>
    union !== error
    && error.schemaPath.startsWith(unionBranchSchemaPrefix(union))
    && isSameOrNestedInstancePath(error.instancePath, union.instancePath)))
}

function unionBranchSchemaPrefix(error: ValidationSchemaError): string {
  const separator = error.schemaPath.endsWith("/") ? "" : "/"
  return `${error.schemaPath}${separator}${error.keyword}/`
}

function isSameOrNestedInstancePath(candidate: string, parent: string): boolean {
  return candidate === parent || parent === "" || candidate.startsWith(`${parent}/`)
}

export function validationIssueTargetKey(target: ValidationIssueTarget): string {
  const path = `/${target.path.map(pointerSegment).join("/")}`
  return target.kind === "occurrence"
    ? `${target.kind}:${path}:${target.occurrence}`
    : `${target.kind}:${path}`
}

function issuesForTypeboxError(
  error: ValidationSchemaError,
  basePath: ValidationIssuePath,
): ValidationIssue[] {
  const path = [...basePath, ...validationIssuePathFromPointer(error.instancePath)]
  const common = {
    code: `schema.${error.keyword}`,
    kind: "semantic" as const,
    params: structuredClone(error.params),
  }
  if (error.keyword === "required") {
    const required = requiredPropertyNames(error.params)
    return required.length === 0
      ? [{ ...common, target: { kind: "missing", path } }]
      : required.map((property) => ({
          ...common,
          target: { kind: "missing" as const, path: [...path, property] },
        }))
  }
  if (error.keyword === "uniqueItems") {
    const occurrence = duplicateOccurrence(error.params)
    if (occurrence !== undefined) {
      return [{ ...common, target: { kind: "occurrence", path, occurrence } }]
    }
  }
  if (error.keyword === "propertyNames") {
    const property = invalidPropertyName(error.params)
    if (property !== undefined) {
      return [{ ...common, target: { kind: "path", path: [...path, property] } }]
    }
  }
  if (error.keyword === "additionalProperties") {
    const properties = additionalPropertyNames(error.params)
    return properties.length === 0
      ? [{ ...common, target: { kind: "path", path } }]
      : properties.map((property) => ({
          ...common,
          target: { kind: "path" as const, path: [...path, property] },
        }))
  }
  return [{ ...common, target: { kind: "path", path } }]
}

function requiredPropertyNames(params: Readonly<Record<string, unknown>>): string[] {
  if (Array.isArray(params.requiredProperties)) {
    return params.requiredProperties.filter((value): value is string => typeof value === "string")
  }
  return typeof params.missingProperty === "string" ? [params.missingProperty] : []
}

function duplicateOccurrence(params: Readonly<Record<string, unknown>>): number | undefined {
  for (const candidate of [params.duplicateIndex, params.j, params.index]) {
    if (typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0) return candidate
  }
  return undefined
}

function invalidPropertyName(params: Readonly<Record<string, unknown>>): string | undefined {
  for (const candidate of [params.propertyName, params.property, params.name]) {
    if (typeof candidate === "string") return candidate
  }
  return undefined
}

function additionalPropertyNames(params: Readonly<Record<string, unknown>>): string[] {
  if (Array.isArray(params.additionalProperties)) {
    return params.additionalProperties.filter((value): value is string => typeof value === "string")
  }
  return typeof params.additionalProperty === "string" ? [params.additionalProperty] : []
}

export function validationIssuePathFromPointer(pointer: string): ValidationIssuePath {
  if (pointer === "" || pointer === "/") return []
  return pointer.slice(1).split("/").map((segment) => {
    const decoded = segment.replace(/~1/gu, "/").replace(/~0/gu, "~")
    return /^\d+$/u.test(decoded) ? Number.parseInt(decoded, 10) : decoded
  })
}

function pointerSegment(segment: string | number): string {
  return String(segment).replace(/~/gu, "~0").replace(/\//gu, "~1")
}
