import type { ErrorObject, ValidateFunction } from "ajv"
import type Ajv2020 from "ajv/dist/2020.js"
import type { TSchema } from "typebox"
import { compileTypeboxValidationSchema } from "./typeboxValidationCompiler"

export type SchemaContext = Record<string, TSchema>

export interface ValidationSchemaError {
  keyword: string
  schemaPath: string
  instancePath: string
  params: Record<string, unknown>
  message: string
}

export interface ValidationSchemaValidator {
  Check(value: unknown): boolean
  Errors(value: unknown): [boolean, ValidationSchemaError[]]
}

const undefinedKeyword = "x-nkdk-undefined"

export function compileValidationSchema<const Type extends TSchema>(
  schema: Type
): ValidationSchemaValidator
export function compileValidationSchema<Context extends SchemaContext, const Type extends TSchema>(
  context: Context,
  schema: Type
): ValidationSchemaValidator
export function compileValidationSchema(
  schemaOrContext: TSchema | SchemaContext,
  maybeSchema?: TSchema
): ValidationSchemaValidator {
  const context = maybeSchema === undefined ? {} : schemaOrContext as SchemaContext
  const schema = maybeSchema === undefined ? schemaOrContext as TSchema : maybeSchema
  return compileTypeboxValidationSchema(context, schema)
}

function normalizeAjvErrors(errors: typeof Ajv2020.prototype.errors): ValidationSchemaError[] {
  return (errors ?? []).map(normalizeAjvError)
}

function normalizeAjvError(error: ErrorObject): ValidationSchemaError {
  return {
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    instancePath: error.instancePath,
    params: error.params as Record<string, unknown>,
    message: error.message ?? error.keyword,
  }
}

class AjvFunctionValidationSchema implements ValidationSchemaValidator {
  constructor(private readonly validate: ValidateFunction) {}

  Check(value: unknown): boolean {
    return this.validate(value)
  }

  Errors(value: unknown): [boolean, ValidationSchemaError[]] {
    const valid = this.validate(value)
    if (valid) return [true, []]
    return [false, normalizeAjvErrors(this.validate.errors)]
  }
}

export function createValidationSchemaFromAjvFunction(validate: ValidateFunction): ValidationSchemaValidator {
  return new AjvFunctionValidationSchema(validate)
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
