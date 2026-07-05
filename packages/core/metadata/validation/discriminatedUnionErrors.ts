import type { TSchema } from "typebox"
import Schema, { type Validator } from "typebox/schema"
import type { TLocalizedValidationError } from "typebox/error"

export type ValidationError = TLocalizedValidationError & {
  schema?: TSchema
  value?: unknown
  diagnosticLocation?: "key"
}

interface DiscriminatedUnionSchema extends TSchema {
  anyOf: TSchema[]
  discriminantKey: string
}

interface BranchSchema extends TSchema {
  properties?: Record<string, { const?: unknown }>
}

interface BranchEntry {
  schema: TSchema
  compiled?: Validator<TSchema>
}

interface BranchCache {
  branches: Map<string, BranchEntry>
  expectedValues: string[]
}

interface ExpansionContext {
  root?: TSchema
  schemaContext: Record<string, TSchema>
  referenceKey: string
}

const emptyExpansionContext: ExpansionContext = { schemaContext: {}, referenceKey: "" }
const unionSchemaCache = new WeakMap<TSchema, Map<string, BranchCache>>()
let expansionContextCache = new WeakMap<Validator<TSchema>, ExpansionContext>()
let expansionContextBuildCountForTests = 0

function isDiscriminatedUnionSchema(schema: TSchema | undefined): schema is DiscriminatedUnionSchema {
  return (
    typeof (schema as { discriminantKey?: unknown } | undefined)?.discriminantKey === "string" &&
    Array.isArray((schema as { anyOf?: unknown } | undefined)?.anyOf)
  )
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

function getByJsonPointer(root: unknown, pointer: string): unknown {
  if (pointer === "" || pointer === "#") return root
  const path = pointer.startsWith("#") ? pointer.slice(1) : pointer
  if (path === "") return root

  let current = root
  for (const rawSegment of path.slice(1).split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~")
    if (Array.isArray(current)) {
      current = current[Number(segment)]
    } else if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }

  return current
}

function findByJsonPointerSuffix(root: unknown, pointer: string): unknown {
  const suffix = pointer.startsWith("#") ? pointer.slice(1) : pointer
  if (suffix === "") return root

  const seen = new WeakSet<object>()
  let result: unknown

  function visit(value: unknown, path: string): void {
    if (result !== undefined || typeof value !== "object" || value === null || seen.has(value)) return
    seen.add(value)

    if (path.endsWith(suffix)) {
      result = value
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}/${index}`))
      return
    }

    for (const [key, item] of Object.entries(value)) {
      visit(item, `${path}/${escapeJsonPointerSegment(key)}`)
    }
  }

  visit(root, "#")
  return result
}

function schemaForError(error: ValidationError, context: ExpansionContext): TSchema | undefined {
  if (error.schema !== undefined) return error.schema
  if (context.root === undefined) return undefined

  const schemaPath = error.schemaPath.replace(/\/(?:anyOf|oneOf)$/, "")
  const schema = getByJsonPointer(context.root, schemaPath) ?? findByJsonPointerSuffix(context.root, schemaPath)
  return isSchema(schema) ? schema : undefined
}

function isSchema(value: unknown): value is TSchema {
  return typeof value === "object" && value !== null
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

function getCompiledBranch(entry: BranchEntry, context: ExpansionContext): Validator<TSchema> | undefined {
  if (entry.compiled !== undefined) return entry.compiled

  try {
    entry.compiled = Schema.Compile(context.schemaContext, entry.schema)
    return entry.compiled
  } catch {
    return undefined
  }
}

function formatDiscriminatorValue(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : "не задано"
}

function createUnknownDiscriminatorError(
  error: ValidationError,
  discriminantKey: string,
  expectedValues: string[],
  value: unknown
): ValidationError {
  return {
    ...error,
    keyword: "anyOf",
    instancePath: prefixJsonPointer(error.instancePath, `/${escapeJsonPointerSegment(discriminantKey)}`),
    value,
    message: `Неизвестное значение дискриминатора "${discriminantKey}": ${formatDiscriminatorValue(
      value
    )}. Ожидается одно из: ${expectedValues.join(", ")}`,
  }
}

function markAdditionalPropertyAtKey(error: ValidationError): ValidationError {
  if (error.keyword !== "additionalProperties") return error
  return { ...error, diagnosticLocation: "key" }
}

function expandDiscriminatedUnionError(error: ValidationError, context: ExpansionContext): ValidationError[] {
  if (error.keyword !== "anyOf") return [error]

  const schema = schemaForError(error, context)
  if (!isDiscriminatedUnionSchema(schema)) return [error]

  const unionValue = getByJsonPointer(error.value, error.instancePath) ?? error.value
  const discriminantValue = getObjectProperty(unionValue, schema.discriminantKey)
  const cache = getBranchCache(schema, context)
  const branchEntry = typeof discriminantValue === "string" ? cache.branches.get(discriminantValue) : undefined

  if (branchEntry === undefined) {
    return [createUnknownDiscriminatorError(error, schema.discriminantKey, cache.expectedValues, discriminantValue)]
  }

  const branch = getCompiledBranch(branchEntry, context)
  if (branch === undefined) return [error]

  const [, branchErrors] = branch.Errors(unionValue)
  return expandDiscriminatedUnionErrorsWithContext(
    branchErrors.map((branchError) => ({ ...branchError, value: unionValue })),
    context
  ).map((branchError) =>
    markAdditionalPropertyAtKey({
      ...branchError,
      instancePath: prefixJsonPointer(error.instancePath, branchError.instancePath),
    })
  )
}

function isDiscriminatedUnionError(error: ValidationError, context: ExpansionContext): boolean {
  return error.keyword === "anyOf" && isDiscriminatedUnionSchema(schemaForError(error, context))
}

function isBranchErrorOfDiscriminatedUnion(
  error: ValidationError,
  unionError: ValidationError,
  context: ExpansionContext
): boolean {
  if (!isDiscriminatedUnionError(unionError, context)) return false
  if (!error.schemaPath.startsWith(`${unionError.schemaPath}/anyOf/`)) return false
  return error.instancePath === unionError.instancePath || error.instancePath.startsWith(`${unionError.instancePath}/`)
}

function collectSchemaContext(schema: TSchema): Record<string, TSchema> {
  const context: Record<string, TSchema> = {}
  const seen = new WeakSet<object>()

  function visit(value: unknown): void {
    if (typeof value !== "object" || value === null || seen.has(value)) return
    seen.add(value)

    const id = (value as { $id?: unknown }).$id
    if (typeof id === "string") context[id] = value as TSchema

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    Object.values(value).forEach(visit)
  }

  visit(schema)
  return context
}

function getExpansionContext(schema?: Validator<TSchema>): ExpansionContext {
  if (schema === undefined) return emptyExpansionContext

  const cached = expansionContextCache.get(schema)
  if (cached !== undefined) return cached

  const context = createExpansionContext(schema)
  expansionContextCache.set(schema, context)

  return context
}

function createExpansionContext(schema: Validator<TSchema>): ExpansionContext {
  expansionContextBuildCountForTests += 1
  const root = schema.Schema()
  const schemaContext = collectSchemaContext(root)

  return {
    root,
    schemaContext,
    referenceKey: Object.keys(schemaContext).sort().join("\u0000"),
  }
}

export function resetDiscriminatedUnionExpansionContextCacheForTests(): void {
  expansionContextCache = new WeakMap<Validator<TSchema>, ExpansionContext>()
  expansionContextBuildCountForTests = 0
}

export function getDiscriminatedUnionExpansionContextBuildCountForTests(): number {
  return expansionContextBuildCountForTests
}

export function expandDiscriminatedUnionErrors(
  errors: ValidationError[],
  schema?: Validator<TSchema>
): ValidationError[] {
  return expandDiscriminatedUnionErrorsWithContext(errors, getExpansionContext(schema))
}

function expandDiscriminatedUnionErrorsWithContext(
  errors: ValidationError[],
  context: ExpansionContext
): ValidationError[] {
  const discriminatedUnionErrors = errors.filter((error) => isDiscriminatedUnionError(error, context))

  return errors.flatMap((error) => {
    if (
      error.keyword !== "anyOf" &&
      discriminatedUnionErrors.some((unionError) => isBranchErrorOfDiscriminatedUnion(error, unionError, context))
    ) {
      return []
    }

    return expandDiscriminatedUnionError(error, context)
  })
}
