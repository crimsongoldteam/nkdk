export interface SchemaSummaryOptions {
  requiredOnly?: boolean
  search?: string
  exact?: boolean
  keyTerms?: string
}

export interface SchemaSummary {
  fields: SchemaFieldSummary[]
}

export interface SchemaFieldSummary {
  key: string
  required: boolean
  [property: string]: unknown
}

interface FieldCandidate {
  key: string
  required: boolean
  schema: Record<string, unknown>
}

export function summarizeJSONSchema(schema: unknown, options: SchemaSummaryOptions = {}): SchemaSummary | undefined {
  const fields = collectFieldCandidates(schema)
    .map((field) => normalizeFieldSummary(field))
    .filter((field) => matchesOptions(field, options))

  if (fields.length === 0) {
    return undefined
  }

  return { fields }
}

export function listSchemaSummaryKeys(schema: unknown, options: SchemaSummaryOptions = {}): string[] {
  return summarizeJSONSchema(schema, options)?.fields.map((field) => field.key) ?? []
}

export function splitSearchTerms(terms: string | undefined): string[] {
  return (
    terms
      ?.split("|")
      .map((term) => term.trim())
      .filter((term) => term.length > 0) ?? []
  )
}

function collectFieldCandidates(schema: unknown): FieldCandidate[] {
  const fields: FieldCandidate[] = []
  const collectedKeys = new Set<string>()

  collectFieldsFromSchema(schema, fields, collectedKeys)

  return fields
}

function collectFieldsFromSchema(schema: unknown, fields: FieldCandidate[], collectedKeys: Set<string>): void {
  if (!isRecord(schema)) {
    return
  }

  collectObjectProperties(schema, fields, collectedKeys)

  for (const branchKey of ["anyOf", "oneOf", "allOf"]) {
    const branches = schema[branchKey]

    if (!Array.isArray(branches)) {
      continue
    }

    for (const branch of branches) {
      collectFieldsFromSchema(branch, fields, collectedKeys)
    }
  }
}

function collectObjectProperties(
  schema: Record<string, unknown>,
  fields: FieldCandidate[],
  collectedKeys: Set<string>
): void {
  const properties = schema.properties

  if (!isRecord(properties)) {
    return
  }

  const requiredKeys = readRequiredKeys(schema.required)

  for (const [key, value] of Object.entries(properties)) {
    if (collectedKeys.has(key) || !isRecord(value)) {
      continue
    }

    collectedKeys.add(key)
    fields.push({
      key,
      required: requiredKeys.has(key),
      schema: value,
    })
  }
}

function readRequiredKeys(required: unknown): Set<string> {
  if (!Array.isArray(required)) {
    return new Set()
  }

  return new Set(required.filter((key): key is string => typeof key === "string"))
}

function normalizeFieldSummary(field: FieldCandidate): SchemaFieldSummary {
  const normalizedSchema = removeEmptyValues(normalizeScalarType(field.schema))
  const schemaProperties = isRecord(normalizedSchema) ? normalizedSchema : {}

  return {
    key: field.key,
    required: field.required,
    ...schemaProperties,
  }
}

function normalizeScalarType(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeScalarType(item))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "type" && typeof item === "string" ? [item] : normalizeScalarType(item),
    ])
  )
}

function removeEmptyValues(value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return undefined
  }

  if (Array.isArray(value)) {
    const values = value.map((item) => removeEmptyValues(item)).filter((item) => item !== undefined)

    return values.length > 0 ? values : undefined
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, removeEmptyValues(item)] as const)
      .filter(([, item]) => item !== undefined)

    return entries.length > 0 ? Object.fromEntries(entries) : undefined
  }

  return value
}

function matchesOptions(field: SchemaFieldSummary, options: SchemaSummaryOptions): boolean {
  if (options.requiredOnly && !field.required) {
    return false
  }

  if (!matchesKeyTerms(field.key, options.keyTerms)) {
    return false
  }

  if (!matchesSearch(field, options)) {
    return false
  }

  return true
}

function matchesKeyTerms(key: string, keyTerms: string | undefined): boolean {
  const terms = splitSearchTerms(keyTerms)

  return terms.length === 0 || terms.some((term) => includesRussianLower(key, term))
}

function matchesSearch(field: SchemaFieldSummary, options: SchemaSummaryOptions): boolean {
  const terms = splitSearchTerms(options.search)

  if (terms.length === 0) {
    return true
  }

  if (options.exact) {
    return field.key.toLocaleLowerCase("ru-RU") === options.search?.trim().toLocaleLowerCase("ru-RU")
  }

  const text = collectSearchText(field).join("\n")

  return terms.some((term) => includesRussianLower(text, term))
}

function collectSearchText(value: unknown): string[] {
  if (value === null || value === undefined) {
    return []
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSearchText(item))
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) => [key, ...collectSearchText(item)])
  }

  return []
}

function includesRussianLower(value: string, term: string): boolean {
  return value.toLocaleLowerCase("ru-RU").includes(term.toLocaleLowerCase("ru-RU"))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
