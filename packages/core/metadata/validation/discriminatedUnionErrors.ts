import { TSchema } from "@sinclair/typebox"
import { TypeCheck, TypeCompiler, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"

interface DiscriminatedUnionSchema extends TSchema {
  anyOf: TSchema[]
  discriminantKey: string
}

interface BranchSchema extends TSchema {
  properties?: Record<string, { const?: unknown }>
}

interface DiagnosticLocationSchema extends TSchema {
  diagnosticLocation?: "key"
}

interface BranchCache {
  branches: Map<string, TypeCheck<TSchema>>
  expectedValues: string[]
}

const unionSchemaCache = new WeakMap<TSchema, BranchCache>()

function isDiscriminatedUnionSchema(schema: TSchema): schema is DiscriminatedUnionSchema {
  return typeof schema.discriminantKey === "string" && Array.isArray(schema.anyOf)
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1")
}

function prefixJsonPointer(parentPath: string, childPath: string): string {
  if (!parentPath) return childPath
  if (!childPath) return parentPath
  return `${parentPath}${childPath}`
}

function getObjectProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  return (value as Record<string, unknown>)[key]
}

function getBranchCache(schema: DiscriminatedUnionSchema): BranchCache {
  const cached = unionSchemaCache.get(schema)
  if (cached) return cached

  const branches = new Map<string, TypeCheck<TSchema>>()
  const expectedValues: string[] = []

  for (const branch of schema.anyOf) {
    const branchSchema = branch as BranchSchema
    const discriminatorValue = branchSchema.properties?.[schema.discriminantKey]?.const
    if (typeof discriminatorValue !== "string") continue

    branches.set(discriminatorValue, TypeCompiler.Compile(branch))
    expectedValues.push(discriminatorValue)
  }

  const cache = { branches, expectedValues }
  unionSchemaCache.set(schema, cache)
  return cache
}

function formatDiscriminatorValue(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : "не задано"
}

function createUnknownDiscriminatorError(
  error: ValueError,
  discriminantKey: string,
  expectedValues: string[],
  value: unknown,
): ValueError {
  return {
    type: ValueErrorType.Union,
    schema: error.schema,
    path: prefixJsonPointer(error.path, `/${escapeJsonPointerSegment(discriminantKey)}`),
    value,
    message: `Неизвестное значение дискриминатора "${discriminantKey}": ${formatDiscriminatorValue(
      value,
    )}. Ожидается одно из: ${expectedValues.join(", ")}`,
    errors: [],
  }
}

function markAdditionalPropertyAtKey(error: ValueError): ValueError {
  if (error.type !== ValueErrorType.ObjectAdditionalProperties) return error

  const schema: DiagnosticLocationSchema = {
    ...error.schema,
    diagnosticLocation: "key",
  }

  return { ...error, schema }
}

function expandDiscriminatedUnionError(error: ValueError): ValueError[] {
  if (error.type !== ValueErrorType.Union || !isDiscriminatedUnionSchema(error.schema)) {
    return [error]
  }

  const discriminantValue = getObjectProperty(error.value, error.schema.discriminantKey)
  const cache = getBranchCache(error.schema)
  const branch = typeof discriminantValue === "string" ? cache.branches.get(discriminantValue) : undefined

  if (!branch) {
    return [
      createUnknownDiscriminatorError(error, error.schema.discriminantKey, cache.expectedValues, discriminantValue),
    ]
  }

  return expandDiscriminatedUnionErrors([...branch.Errors(error.value)]).map((branchError) =>
    markAdditionalPropertyAtKey({
      ...branchError,
      path: prefixJsonPointer(error.path, branchError.path),
    }),
  )
}

export function expandDiscriminatedUnionErrors(errors: ValueError[]): ValueError[] {
  return errors.flatMap(expandDiscriminatedUnionError)
}
