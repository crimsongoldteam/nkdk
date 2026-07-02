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

interface BranchEntry {
  schema: TSchema
  compiled?: TypeCheck<TSchema>
}

interface BranchCache {
  branches: Map<string, BranchEntry>
  expectedValues: string[]
}

interface ExpansionContext {
  references: TSchema[]
  referenceKey: string
}

const emptyExpansionContext: ExpansionContext = { references: [], referenceKey: "" }
const unionSchemaCache = new WeakMap<TSchema, Map<string, BranchCache>>()
let expansionContextCache = new WeakMap<TypeCheck<TSchema>, ExpansionContext>()
let expansionContextBuildCountForTests = 0

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

function getBranchCache(schema: DiscriminatedUnionSchema, context: ExpansionContext): BranchCache {
  const cachedByReferences = unionSchemaCache.get(schema)
  const cached = cachedByReferences?.get(context.referenceKey)
  if (cached !== undefined) return cached

  const branches = new Map<string, BranchEntry>()
  const expectedValues: string[] = []

  for (const branch of schema.anyOf) {
    const branchSchema = branch as BranchSchema
    const discriminatorValue = branchSchema.properties?.[schema.discriminantKey]?.const
    if (typeof discriminatorValue !== "string") continue

    branches.set(discriminatorValue, { schema: branch })
    expectedValues.push(discriminatorValue)
  }

  const cache = { branches, expectedValues }
  if (cachedByReferences === undefined) {
    unionSchemaCache.set(schema, new Map([[context.referenceKey, cache]]))
  } else {
    cachedByReferences.set(context.referenceKey, cache)
  }

  return cache
}

function getCompiledBranch(entry: BranchEntry, context: ExpansionContext): TypeCheck<TSchema> | undefined {
  if (entry.compiled !== undefined) return entry.compiled

  try {
    entry.compiled = TypeCompiler.Compile(entry.schema, context.references)
    return entry.compiled
  } catch {
    return undefined
  }
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

function expandDiscriminatedUnionError(error: ValueError, context: ExpansionContext): ValueError[] {
  if (error.type !== ValueErrorType.Union || !isDiscriminatedUnionSchema(error.schema)) {
    return [error]
  }

  const discriminantValue = getObjectProperty(error.value, error.schema.discriminantKey)
  const cache = getBranchCache(error.schema, context)
  const branchEntry = typeof discriminantValue === "string" ? cache.branches.get(discriminantValue) : undefined

  if (branchEntry === undefined) {
    return [
      createUnknownDiscriminatorError(error, error.schema.discriminantKey, cache.expectedValues, discriminantValue),
    ]
  }

  const branch = getCompiledBranch(branchEntry, context)
  if (branch === undefined) return [error]

  return expandDiscriminatedUnionErrorsWithContext([...branch.Errors(error.value)], context).map((branchError) =>
    markAdditionalPropertyAtKey({
      ...branchError,
      path: prefixJsonPointer(error.path, branchError.path),
    }),
  )
}

function collectSchemaReferences(schema: TSchema, references: TSchema[]): TSchema[] {
  const result = [...references]
  const seen = new WeakSet<object>()
  const knownIds = new Set(result.map((reference) => reference.$id).filter((id): id is string => typeof id === "string"))

  function visit(value: unknown): void {
    if (typeof value !== "object" || value === null || seen.has(value)) return
    seen.add(value)

    if (isSchema(value)) {
      const id = value.$id
      if (typeof id === "string" && !knownIds.has(id)) {
        result.push(value)
        knownIds.add(id)
      }
    }

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    Object.values(value).forEach(visit)
  }

  visit(schema)

  return result
}

function isSchema(value: object): value is TSchema {
  return "$id" in value || "type" in value || "anyOf" in value || "$ref" in value
}

function getExpansionContext(schema?: TypeCheck<TSchema>): ExpansionContext {
  if (schema === undefined) return emptyExpansionContext

  const cached = expansionContextCache.get(schema)
  if (cached !== undefined) return cached

  const context = createExpansionContext(schema)
  expansionContextCache.set(schema, context)

  return context
}

function createExpansionContext(schema: TypeCheck<TSchema>): ExpansionContext {
  expansionContextBuildCountForTests += 1
  const references = collectSchemaReferences(schema.Schema(), schema.References())

  return {
    references,
    referenceKey: references
      .map((reference) => reference.$id)
      .filter((id): id is string => typeof id === "string")
      .join("\u0000"),
  }
}

export function resetDiscriminatedUnionExpansionContextCacheForTests(): void {
  expansionContextCache = new WeakMap<TypeCheck<TSchema>, ExpansionContext>()
  expansionContextBuildCountForTests = 0
}

export function getDiscriminatedUnionExpansionContextBuildCountForTests(): number {
  return expansionContextBuildCountForTests
}

export function expandDiscriminatedUnionErrors(errors: ValueError[], schema?: TypeCheck<TSchema>): ValueError[] {
  return expandDiscriminatedUnionErrorsWithContext(errors, getExpansionContext(schema))
}

function expandDiscriminatedUnionErrorsWithContext(errors: ValueError[], context: ExpansionContext): ValueError[] {
  return errors.flatMap((error) => expandDiscriminatedUnionError(error, context))
}
