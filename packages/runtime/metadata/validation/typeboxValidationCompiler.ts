import type { TLocalizedValidationMessageCallback, TValidationError } from "typebox/error"
import type { TSchema } from "typebox"
import Compile from "typebox/compile"
import { Locale } from "typebox/system"
import type {
  SchemaContext,
  ValidationSchemaError,
  ValidationSchemaValidator,
} from "./validationSchema"

const selectedBranchMarker = Symbol("nkdk-selected-branch-error")

interface SelectedBranchErrorPayload {
  readonly marker: typeof selectedBranchMarker
  readonly error: ValidationSchemaError
}

interface DiscriminatorBranch {
  readonly schema: TSchema
  readonly value: string
}

type LocalizedValidationError = TValidationError & { readonly message: string }

function asRefinementMessage(payload: SelectedBranchErrorPayload): string {
  return payload as unknown as string
}

export function compileTypeboxValidationSchema(
  context: Readonly<Record<string, TSchema>>,
  schema: TSchema,
): ValidationSchemaValidator {
  let preparedContext: SchemaContext = {}
  const localContext: SchemaContext = {}
  let localDefinitionIndex = 0
  const preparedNodes = new WeakMap<object, unknown>()

  const prepareNode = (value: unknown, document: unknown): unknown => {
    if (Array.isArray(value)) {
      const cached = preparedNodes.get(value)
      if (cached !== undefined) return cached
      const result: unknown[] = []
      preparedNodes.set(value, result)
      for (const entry of value) result.push(prepareNode(entry, document))
      return result
    }
    if (!isRecord(value)) return value
    const cached = preparedNodes.get(value)
    if (cached !== undefined) return cached

    const localDefinitions = localDefinitionEntries(value)
    if (localDefinitions !== undefined) {
      const result: Record<string, unknown> = {}
      preparedNodes.set(value, result)
      const aliases = new Map<string, string>()
      const definitions = localDefinitions.entries.map(([key, definition]) => {
        const runtimeId = `nkdk://runtime/local-definition/${localDefinitionIndex++}`
        aliases.set(key, runtimeId)
        if (typeof definition.$id === "string") aliases.set(definition.$id, runtimeId)
        return { definition, runtimeId }
      })
      for (const { definition, runtimeId } of definitions) {
        const rewritten = rewriteLocalDefinitionRefs(definition, aliases)
        rewritten.$id = runtimeId
        localContext[runtimeId] = prepareNode(rewritten, rewritten) as TSchema
      }
      for (const [key, entry] of Object.entries(value)) {
        if (key === "$defs" || key === "$ref") continue
        result[key] = prepareNode(entry, document)
      }
      result.$ref = aliases.get(localDefinitions.rootRef)!
      return result
    }

    const propertyName = discriminatorPropertyName(value)
    if (propertyName !== undefined) {
      const branches = discriminatorBranches(value, document, context, propertyName)
      const result: Record<string, unknown> = {}
      preparedNodes.set(value, result)
      for (const [key, entry] of Object.entries(value)) {
        if (key === "oneOf" || key === "discriminator") continue
        result[key] = prepareNode(entry, document)
      }
      const preparedBranches = branches.map(({ schema: branchSchema, value: branchValue }) => ({
        schema: prepareNode(branchSchema, document) as TSchema,
        value: branchValue,
      }))
      result["~refine"] = [createDiscriminatorRefinement(
        propertyName,
        preparedBranches,
        () => preparedContext,
      )]
      return result
    }

    const union = plainUnion(value)
    if (union !== undefined) {
      const result: Record<string, unknown> = {}
      preparedNodes.set(value, result)
      for (const [key, entry] of Object.entries(value)) {
        if (key === union.keyword) continue
        result[key] = prepareNode(entry, document)
      }
      const preparedBranches = union.branches.map((branch) => prepareNode(branch, document) as TSchema)
      result["~refine"] = [createPlainUnionRefinement(union.keyword, preparedBranches, () => preparedContext)]
      return result
    }

    const result: Record<string, unknown> = {}
    preparedNodes.set(value, result)
    const recordValue = pureAdditionalPropertiesSchema(value)
    for (const [key, entry] of Object.entries(value)) {
      if (recordValue !== undefined && key === "additionalProperties") continue
      result[key] = prepareNode(entry, document)
    }
    if (recordValue !== undefined) {
      result.patternProperties = { "^.*$": prepareNode(recordValue, document) }
      result.additionalProperties = false
    }
    return result
  }

  const explicitContext = Object.fromEntries(
    Object.entries(context).map(([key, contextSchema]) => [key, prepareNode(contextSchema, contextSchema) as TSchema]),
  )
  const preparedSchema = prepareNode(schema, schema) as TSchema
  preparedContext = expandCompileContext({ ...explicitContext, ...localContext })
  const compiled = Compile(preparedContext, preparedSchema)
  return wrapCompiledValidator(compiled)
}

function plainUnion(schema: Record<string, unknown>): {
  readonly keyword: "anyOf" | "oneOf"
  readonly branches: readonly TSchema[]
} | undefined {
  for (const keyword of ["anyOf", "oneOf"] as const) {
    const branches = schema[keyword]
    if (!Array.isArray(branches) || branches.length === 0) continue
    if (!branches.every(isRecord)) throw new Error(`${keyword} должен содержать схемы`)
    return { keyword, branches: branches as TSchema[] }
  }
  return undefined
}

function localDefinitionEntries(schema: Record<string, unknown>): {
  readonly entries: Array<[string, Record<string, unknown>]>
  readonly rootRef: string
} | undefined {
  if (!isRecord(schema.$defs) || typeof schema.$ref !== "string") return undefined
  const entries = Object.entries(schema.$defs)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
  const hasRoot = entries.some(([key, definition]) => key === schema.$ref || definition.$id === schema.$ref)
  return hasRoot ? { entries, rootRef: schema.$ref } : undefined
}

function rewriteLocalDefinitionRefs(
  value: Record<string, unknown>,
  aliases: ReadonlyMap<string, string>,
): Record<string, unknown> {
  return rewriteNode(value, aliases) as Record<string, unknown>
}

function rewriteNode(value: unknown, aliases: ReadonlyMap<string, string>): unknown {
  if (Array.isArray(value)) return value.map((entry) => rewriteNode(entry, aliases))
  if (!isRecord(value)) return value

  const nestedAliases = isRecord(value.$defs)
    ? new Map([...aliases].filter(([key]) => !Object.hasOwn(value.$defs as object, key)))
    : aliases
  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    result[key] = key === "$ref" && typeof entry === "string" && nestedAliases.has(entry)
      ? nestedAliases.get(entry)
      : rewriteNode(entry, nestedAliases)
  }
  return result
}

function pureAdditionalPropertiesSchema(schema: Record<string, unknown>): TSchema | undefined {
  return schema.type === "object"
    && schema.properties === undefined
    && schema.patternProperties === undefined
    && isRecord(schema.additionalProperties)
    ? schema.additionalProperties as TSchema
    : undefined
}

function expandCompileContext(context: SchemaContext): SchemaContext {
  const expanded: SchemaContext = { ...context }
  for (const [key, schema] of Object.entries(context)) {
    if (!isRecord(schema)) continue
    const record = schema
    if (!isRecord(record.$defs)) continue
    for (const [definitionKey, definition] of Object.entries(record.$defs)) {
      if (!isRecord(definition)) continue
      const referenceKey = typeof definition.$id === "string" ? definition.$id : definitionKey
      expanded[referenceKey] ??= definition as TSchema
    }
    if (typeof record.$ref !== "string") continue
    const rootDefinition = record.$defs[record.$ref]
      ?? Object.values(record.$defs).find((definition) => isRecord(definition) && definition.$id === record.$ref)
    if (isRecord(rootDefinition)) expanded[key] = rootDefinition as TSchema
  }
  return expanded
}

function discriminatorPropertyName(schema: Record<string, unknown>): string | undefined {
  if (!Array.isArray(schema.oneOf)) return undefined
  if (!isRecord(schema.discriminator)) return undefined
  return typeof schema.discriminator.propertyName === "string"
    ? schema.discriminator.propertyName
    : undefined
}

function discriminatorBranches(
  schema: Record<string, unknown>,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
  propertyName: string,
): DiscriminatorBranch[] {
  const oneOf = schema.oneOf
  if (!Array.isArray(oneOf) || oneOf.length === 0) {
    throw new Error(`discriminator ${propertyName} должен содержать непустой oneOf`)
  }
  const values = new Set<string>()
  return oneOf.map((branch): DiscriminatorBranch => {
    if (!isRecord(branch)) throw new Error(`ветвь discriminator ${propertyName} должна быть схемой`)
    const value = discriminatorValue(branch, document, context, propertyName, new Set())
    if (typeof value !== "string") {
      throw new Error(`ветвь discriminator ${propertyName} должна содержать строковый const или одно значение enum`)
    }
    if (values.has(value)) throw new Error(`значение discriminator ${propertyName}=${value} повторяется`)
    values.add(value)
    return { schema: branch as TSchema, value }
  })
}

function discriminatorValue(
  schema: unknown,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
  propertyName: string,
  seenRefs: Set<string>,
): unknown {
  if (!isRecord(schema)) return undefined
  if (typeof schema.$ref === "string") {
    const value = visitSchemaRef(schema.$ref, document, context, seenRefs, (resolved) =>
      discriminatorValue(resolved.value, resolved.document, context, propertyName, seenRefs))
    if (value !== undefined) return value
  }
  if (isRecord(schema.properties)) {
    const value = literalSchemaValue(schema.properties[propertyName], document, context, seenRefs)
    if (value !== undefined) return value
  }
  if (Array.isArray(schema.allOf)) {
    for (const entry of schema.allOf) {
      const value = discriminatorValue(entry, document, context, propertyName, seenRefs)
      if (value !== undefined) return value
    }
  }
  return undefined
}

function literalSchemaValue(
  schema: unknown,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
  seenRefs: Set<string>,
): unknown {
  if (!isRecord(schema)) return undefined
  if (Object.hasOwn(schema, "const")) return schema.const
  if (Array.isArray(schema.enum) && schema.enum.length === 1) return schema.enum[0]
  if (typeof schema.$ref === "string") {
    return visitSchemaRef(schema.$ref, document, context, seenRefs, (resolved) =>
      literalSchemaValue(resolved.value, resolved.document, context, seenRefs))
  }
  if (Array.isArray(schema.allOf)) {
    for (const entry of schema.allOf) {
      const value = literalSchemaValue(entry, document, context, seenRefs)
      if (value !== undefined) return value
    }
  }
  return undefined
}

function visitSchemaRef(
  ref: string,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
  seenRefs: Set<string>,
  visit: (resolved: { document: unknown; value: unknown }) => unknown,
): unknown {
  if (seenRefs.has(ref)) return undefined
  const resolved = resolveSchemaRef(ref, document, context)
  if (resolved === undefined) return undefined
  seenRefs.add(ref)
  try {
    return visit(resolved)
  } finally {
    seenRefs.delete(ref)
  }
}

function resolveSchemaRef(
  ref: string,
  document: unknown,
  context: Readonly<Record<string, TSchema>>,
): { document: unknown; value: unknown } | undefined {
  const exact = context[ref]
  if (exact !== undefined) return { document: exact, value: exact }

  const hashIndex = ref.indexOf("#")
  const resource = hashIndex === -1 ? ref : ref.slice(0, hashIndex)
  const fragment = hashIndex === -1 ? "" : ref.slice(hashIndex + 1)
  const referencedDocument = resource === ""
    ? document
    : context[resource] ?? Object.values(context).find((entry) => isRecord(entry) && entry.$id === resource)
  if (referencedDocument === undefined) return undefined
  const value = fragment === "" ? referencedDocument : resolveSchemaPointer(referencedDocument, fragment)
  return value === undefined ? undefined : { document: referencedDocument, value }
}

function resolveSchemaPointer(document: unknown, fragment: string): unknown {
  let decoded: string
  try {
    decoded = decodeURIComponent(fragment)
  } catch {
    return undefined
  }
  if (decoded === "") return document
  if (!decoded.startsWith("/")) return undefined
  let current = document
  for (const encodedSegment of decoded.slice(1).split("/")) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined
    const segment = encodedSegment.replaceAll("~1", "/").replaceAll("~0", "~")
    current = (current as Record<string, unknown>)[segment]
    if (current === undefined) return undefined
  }
  return current
}

function createDiscriminatorRefinement(
  propertyName: string,
  branches: readonly DiscriminatorBranch[],
  context: () => SchemaContext,
): { check(value: unknown): boolean; error(value: unknown): string } {
  const branchByValue = new Map(branches.map((branch) => [branch.value, branch.schema]))
  const validatorByValue = new Map<string, ValidationSchemaValidator>()
  const allowedValues = branches.map((branch) => branch.value)

  const selectedBranch = (value: unknown): { value: string; schema: TSchema } | undefined => {
    if (!isRecord(value)) return undefined
    const discriminator = value[propertyName]
    if (typeof discriminator !== "string") return undefined
    const branch = branchByValue.get(discriminator)
    return branch === undefined ? undefined : { value: discriminator, schema: branch }
  }
  const validatorFor = ({ value, schema }: { value: string; schema: TSchema }): ValidationSchemaValidator => {
    let validator = validatorByValue.get(value)
    if (validator === undefined) {
      validator = wrapCompiledValidator(Compile(context(), schema))
      validatorByValue.set(value, validator)
    }
    return validator
  }

  return {
    check(value) {
      const branch = selectedBranch(value)
      return branch !== undefined && validatorFor(branch).Check(value)
    },
    error(value) {
      const branch = selectedBranch(value)
      const error = branch === undefined
        ? discriminatorFieldError(value, propertyName, allowedValues)
        : validatorFor(branch).Errors(value)[1][0]
      if (error === undefined) throw new Error(`ветвь discriminator ${propertyName} не вернула ошибку`)
      return asRefinementMessage({ marker: selectedBranchMarker, error })
    },
  }
}

function createPlainUnionRefinement(
  keyword: "anyOf" | "oneOf",
  branches: readonly TSchema[],
  context: () => SchemaContext,
): { check(value: unknown): boolean; error(): string } {
  let validators: readonly ValidationSchemaValidator[] | undefined
  const branchValidators = (): readonly ValidationSchemaValidator[] => {
    validators ??= branches.map((branch) => wrapCompiledValidator(Compile(context(), branch)))
    return validators
  }
  return {
    check(value) {
      const matches = branchValidators().reduce((count, validator) => count + Number(validator.Check(value)), 0)
      return keyword === "anyOf" ? matches > 0 : matches === 1
    },
    error() {
      return asRefinementMessage({
        marker: selectedBranchMarker,
        error: {
          keyword,
          schemaPath: `#/${keyword}`,
          instancePath: "",
          params: {},
          message: "",
        },
      })
    },
  }
}

function discriminatorFieldError(
  value: unknown,
  propertyName: string,
  allowedValues: readonly string[],
): ValidationSchemaError {
  const discriminator = isRecord(value) ? value[propertyName] : undefined
  const instancePath = `/${escapeJsonPointerSegment(propertyName)}`
  return typeof discriminator === "string"
    ? {
        keyword: "enum",
        schemaPath: "#/discriminator/enum",
        instancePath,
        params: { allowedValues: [...allowedValues] },
        message: "",
      }
    : {
        keyword: "type",
        schemaPath: "#/discriminator/type",
        instancePath,
        params: { type: "string" },
        message: "",
      }
}

function wrapCompiledValidator(compiled: {
  Check(value: unknown): boolean
  Errors(value: unknown): Array<TValidationError & { message: string }>
}): ValidationSchemaValidator {
  return {
    Check(value) {
      return compiled.Check(value)
    },
    Errors(value) {
      if (compiled.Check(value)) return [true, []]
      const previousLocale = Locale.Get()
      Locale.Set(createCollectingLocale(previousLocale))
      try {
        const errors = compiled.Errors(value).map(toCollectedValidationSchemaError)
        if (errors.length === 0) throw new Error("TypeBox не вернул ошибку для невалидного значения")
        return [false, errors]
      } finally {
        Locale.Set(previousLocale)
      }
    },
  }
}

function createCollectingLocale(previousLocale: TLocalizedValidationMessageCallback): TLocalizedValidationMessageCallback {
  return (sourceError) => {
    const payload = selectedBranchPayload(sourceError)
    return payload === undefined ? previousLocale(sourceError) : previousLocale(payload.error as TValidationError)
  }
}

function toCollectedValidationSchemaError(sourceError: LocalizedValidationError): ValidationSchemaError {
  const payload = selectedBranchPayload(sourceError)
  if (payload === undefined) return toValidationSchemaError(sourceError)
  return {
    ...payload.error,
    instancePath: `${sourceError.instancePath}${payload.error.instancePath}`,
    schemaPath: joinSchemaPaths(sourceError.schemaPath, payload.error.schemaPath),
    message: sourceError.message,
  }
}

function selectedBranchPayload(error: TValidationError): SelectedBranchErrorPayload | undefined {
  if (error.keyword !== "~refine") return undefined
  const message: unknown = error.params.message
  return isRecord(message) && message.marker === selectedBranchMarker && isValidationSchemaError(message.error)
    ? { marker: selectedBranchMarker, error: message.error }
    : undefined
}

function toValidationSchemaError(error: LocalizedValidationError): ValidationSchemaError {
  return {
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    instancePath: error.instancePath,
    params: error.params as Record<string, unknown>,
    message: error.message,
  }
}

function joinSchemaPaths(parent: string, child: string): string {
  if (child === "#") return parent
  if (child.startsWith("#")) return `${parent}${child.slice(1)}`
  return `${parent}/${child}`
}

function escapeJsonPointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1")
}

function isValidationSchemaError(value: unknown): value is ValidationSchemaError {
  return isRecord(value)
    && typeof value.keyword === "string"
    && typeof value.schemaPath === "string"
    && typeof value.instancePath === "string"
    && isRecord(value.params)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}
