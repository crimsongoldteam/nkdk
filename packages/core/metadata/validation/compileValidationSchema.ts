import Ajv2020, { type Options } from "ajv/dist/2020"
import addFormats from "ajv-formats"
import type { TSchema } from "typebox"
import Schema from "typebox/schema"

export type SchemaContext = Record<string, TSchema>

export interface CompileValidationSchemaOptions {
  inlineRefs?: Options["inlineRefs"]
  eagerFallback?: boolean
}

export interface ValidationSchemaError {
  keyword: string
  schemaPath: string
  instancePath: string
  params: Record<string, unknown>
  message: string
  schema?: TSchema
  value?: unknown
}

export interface ValidationSchemaValidator<Type extends TSchema = TSchema> {
  Check(value: unknown): boolean
  Errors(value: unknown): [boolean, ValidationSchemaError[]]
  Schema(): Type
  Context(): SchemaContext
}

const ajvOptions: Options = {
  addUsedSchema: false,
  allowUnionTypes: true,
  discriminator: true,
  strict: false,
  verbose: true,
}

const undefinedKeyword = "x-nkdk-undefined"

export function compileValidationSchema<const Type extends TSchema>(
  schema: Type,
  options?: CompileValidationSchemaOptions
): ValidationSchemaValidator<Type>
export function compileValidationSchema<Context extends SchemaContext, const Type extends TSchema>(
  context: Context,
  schema: Type,
  options?: CompileValidationSchemaOptions
): ValidationSchemaValidator<Type>
export function compileValidationSchema(
  schemaOrContext: TSchema | SchemaContext,
  schemaOrOptions?: TSchema | CompileValidationSchemaOptions,
  maybeOptions?: CompileValidationSchemaOptions
): ValidationSchemaValidator {
  const hasOptionsAsSecondArgument = isCompileValidationSchemaOptions(schemaOrOptions)
  const hasExplicitContext = schemaOrOptions !== undefined && !hasOptionsAsSecondArgument
  const context = hasExplicitContext ? (schemaOrContext as SchemaContext) : {}
  const schema = hasExplicitContext ? (schemaOrOptions as TSchema) : (schemaOrContext as TSchema)
  const options = hasExplicitContext ? maybeOptions : (schemaOrOptions as CompileValidationSchemaOptions | undefined)
  const ajvSchema = prepareSchemaForAjv(schema)
  const check = createAjv(context, { allErrors: false, inlineRefs: options?.inlineRefs }).compile(ajvSchema)
  const useFallbackCheck = hasLocalDefinitions(schema) && !hasExplicitContext
  let fallback: ValidationSchemaValidator | undefined
  const getFallback = (): ValidationSchemaValidator => {
    fallback ??= createTypeboxFallback(context, schema, hasExplicitContext)
    return fallback
  }
  if (options?.eagerFallback === true && useFallbackCheck) {
    fallback = createTypeboxFallback(context, schema, hasExplicitContext)
  }

  return {
    Check(value) {
      if (useFallbackCheck) return getFallback().Check(value)

      try {
        return check(value)
      } catch (caught) {
        if (!(caught instanceof RangeError)) throw caught
        return getFallback().Check(value)
      }
    },
    Errors(value) {
      if (useFallbackCheck) return getFallback().Errors(value)

      try {
        const valid = check(value)
        if (valid) return [true, []]
        return [false, normalizeAjvErrors(check.errors)]
      } catch (caught) {
        if (!(caught instanceof RangeError)) throw caught
      }

      return getFallback().Errors(value)
    },
    Schema() {
      return schema
    },
    Context() {
      return context
    },
  }
}

function normalizeAjvErrors(errors: typeof Ajv2020.prototype.errors): ValidationSchemaError[] {
  return (errors ?? []).map((error) => ({
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    instancePath: error.instancePath,
    params: error.params as Record<string, unknown>,
    message: error.message ?? error.keyword,
    schema: error.schema as TSchema | undefined,
    value: error.data,
  }))
}

function isCompileValidationSchemaOptions(value: unknown): value is CompileValidationSchemaOptions {
  if (value === undefined) return false
  if (value === null || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  return "inlineRefs" in record || "eagerFallback" in record
}

function createTypeboxFallback(
  context: SchemaContext,
  schema: TSchema,
  hasExplicitContext: boolean
): ValidationSchemaValidator {
  const compiled =
    hasExplicitContext === true
      ? Schema.Compile(context, schema)
      : Schema.Compile(schema)

  return {
    Check(value) {
      return compiled.Check(value)
    },
    Errors(value) {
      return compiled.Errors(value) as [boolean, ValidationSchemaError[]]
    },
    Schema() {
      return schema
    },
    Context() {
      return context
    },
  }
}

function createAjv(context: SchemaContext, options: Pick<Options, "allErrors" | "inlineRefs">): Ajv2020 {
  const ajv = new Ajv2020({ ...ajvOptions, ...options })
  addFormats(ajv)
  ajv.addKeyword({
    keyword: undefinedKeyword,
    metaSchema: { type: "boolean" },
    validate: (schema: boolean, data: unknown) => schema !== true || data === undefined,
  })

  for (const [key, schema] of Object.entries(context)) {
    ajv.addSchema(prepareSchemaForAjv(schema, { keepRootId: true }), key)
  }

  return ajv
}

interface PrepareSchemaOptions {
  keepRootId?: boolean
}

interface RefScope {
  pointer: string
  names: Set<string>
}

interface CurrentDefinition {
  name: string
  dataDepth: number
}

type SchemaMapKind = "defs" | "properties"

export function prepareSchemaForAjv(schema: TSchema, options: PrepareSchemaOptions = {}): TSchema {
  return prepareSchemaNode(schema, {
    scopes: [],
    pointer: "",
    isRoot: true,
    keepRootId: options.keepRootId === true,
    dataDepth: 0,
  }) as TSchema
}

function prepareSchemaNode(
  value: unknown,
  state: {
    scopes: RefScope[]
    pointer: string
    isRoot: boolean
    keepRootId: boolean
    dataDepth: number
    currentDefinition?: CurrentDefinition
    mapKind?: SchemaMapKind
  }
): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      prepareSchemaNode(item, { ...state, pointer: `${state.pointer}/${index}`, isRoot: false })
    )
  }
  if (value === null || typeof value !== "object") return value

  const record = value as Record<string, unknown>
  const localScope = localRefScope(record, state.pointer)
  const scopes = localScope === undefined ? state.scopes : [...state.scopes, localScope]
  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(record)) {
    if (key === "$id" && !(state.isRoot && state.keepRootId)) continue
    if (key === "type" && entry === "undefined") {
      result[undefinedKeyword] = true
      continue
    }

    if (key === "$ref" && typeof entry === "string") {
      if (isSameDataSelfRef(entry, state)) {
        result.not = {}
      } else {
        result[key] = rewriteLocalRef(entry, scopes) ?? entry
      }
      continue
    }

    result[key] = prepareSchemaNode(entry, {
      scopes,
      pointer: `${state.pointer}/${escapeJsonPointerSegment(key)}`,
      isRoot: false,
      keepRootId: state.keepRootId,
      dataDepth: childDataDepth(key, state),
      currentDefinition: childDefinition(key, state),
      mapKind: childMapKind(key),
    })
  }

  return result
}

function childDataDepth(key: string, state: { dataDepth: number; mapKind?: SchemaMapKind }): number {
  if (state.mapKind === "properties") return state.dataDepth + 1
  if (key === "items" || key === "additionalProperties") return state.dataDepth + 1
  return state.dataDepth
}

function childDefinition(
  key: string,
  state: { dataDepth: number; currentDefinition?: CurrentDefinition; mapKind?: SchemaMapKind }
): CurrentDefinition | undefined {
  if (state.mapKind === "defs") return { name: key, dataDepth: state.dataDepth }
  return state.currentDefinition
}

function childMapKind(key: string): SchemaMapKind | undefined {
  if (key === "$defs") return "defs"
  if (key === "properties" || key === "patternProperties") return "properties"
  return undefined
}

function isSameDataSelfRef(
  ref: string,
  state: { currentDefinition?: CurrentDefinition; dataDepth: number }
): boolean {
  return state.currentDefinition?.name === ref && state.currentDefinition.dataDepth === state.dataDepth
}

function hasLocalDefinitions(schema: TSchema): boolean {
  function visit(value: unknown): boolean {
    if (Array.isArray(value)) return value.some(visit)
    if (value === null || typeof value !== "object") return false

    const record = value as Record<string, unknown>
    if (record.$defs !== undefined) return true

    return Object.values(record).some(visit)
  }

  return visit(schema)
}

function localRefScope(record: Record<string, unknown>, pointer: string): RefScope | undefined {
  const defs = record.$defs
  if (defs === null || typeof defs !== "object" || Array.isArray(defs)) return undefined

  return {
    pointer,
    names: new Set(Object.keys(defs)),
  }
}

function rewriteLocalRef(ref: string, scopes: RefScope[]): string | undefined {
  if (ref.startsWith("#") || ref.includes("://")) return undefined

  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index]!
    if (scope.names.has(ref)) {
      return `#${scope.pointer}/$defs/${escapeJsonPointerSegment(ref)}`
    }
  }

  return undefined
}

function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1")
}
