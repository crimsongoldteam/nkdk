import { createHash } from "node:crypto"
import { fingerprintRulesSources, fingerprintRulesSourceTree, type RulesSourceEntry } from "../../scripts/rulesSourceFingerprint.mjs"
import { registerCoreMetadata } from "../register"
import { getRegisteredPropertyRuleTypes } from "../orchestration/property/propertyTypeKeys"
import { getRegisteredTypeRules } from "../orchestration/property/typeRuleRegistry"
import { getRegisteredProjectSpecs } from "../project/projectSpecRegistry"
import { registeredProjectValidationFormRules } from "../validation/projectValidationFormRules"
import { createProjectValidationStandaloneSchemaSet } from "../validation/projectValidationStandaloneSchemas"
import { NKDK_CORE_VERSION } from "../../version"

declare const __NKDK_RULES_SOURCE_FINGERPRINT__: string | undefined

export const PROJECT_STATE_SCHEMA_VERSION = 1 as const
export const PROJECT_STATE_HASH_ALGORITHM = "xxhash64-be-v1" as const

export interface ProjectStateCompatibility {
  readonly schemaVersion: 1
  readonly producerVersion: string
  readonly rulesFingerprint: string
  readonly hashAlgorithm: "xxhash64-be-v1"
}

export interface ProjectStateRulesSnapshot {
  readonly projectSpecs: readonly unknown[]
  readonly schemas: Readonly<Record<string, unknown>>
  readonly localRules: readonly unknown[]
}

export function createProjectStateCompatibility(
  producerVersion = NKDK_CORE_VERSION,
): ProjectStateCompatibility {
  registerCoreMetadata()
  return {
    schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
    producerVersion,
    rulesFingerprint: fingerprintProjectStateRulesSnapshot(currentRulesSnapshot()),
    hashAlgorithm: PROJECT_STATE_HASH_ALGORITHM,
  }
}

export function fingerprintProjectStateRulesSnapshot(snapshot: ProjectStateRulesSnapshot): string {
  const normalized = {
    projectSpecs: sortCanonical(snapshot.projectSpecs),
    schemas: snapshot.schemas,
    localRules: sortCanonical(snapshot.localRules),
  }
  return createHash("sha256").update(canonicalJson(normalized)).digest("hex")
}

export function fingerprintProjectStateRuleSources(entries: readonly RulesSourceEntry[]): string {
  return fingerprintRulesSources(entries)
}

export function fingerprintRegisteredProjectStateTypeRules(): string {
  registerCoreMetadata()
  return fingerprintProjectStateRulesSnapshot({ projectSpecs: [], schemas: {}, localRules: currentTypeRulesSnapshot() })
}

function currentRulesSnapshot(): ProjectStateRulesSnapshot {
  const schemas = createProjectValidationStandaloneSchemaSet()
  return {
    projectSpecs: getRegisteredProjectSpecs().map(({ dir, kind, rule, exportSchema, nesting, resources }) => ({
      dir,
      kind,
      rule,
      exportSchema,
      ...(nesting === undefined ? {} : { nesting }),
      ...(resources === undefined ? {} : { resources }),
    })),
    schemas: {
      context: schemas.context,
      forms: schemas.forms,
      refs: schemas.refs,
      byItemType: schemas.byItemType,
    },
    localRules: [
      { kind: "sourceTree", fingerprint: rulesSourceFingerprint() },
      ...getRegisteredPropertyRuleTypes().map((type) => ({ kind: "property", type })),
      ...currentTypeRulesSnapshot(),
      ...registeredProjectValidationFormRules().map(({ key, rule }) => ({ kind: "form", key, rule })),
    ],
  }
}

function currentTypeRulesSnapshot(): readonly unknown[] {
  return getRegisteredTypeRules().map(({ type, operation, handler, coreRegistrationKeys }) => ({
    kind: "handler",
    type,
    operation,
    handler: coreRegistrationKeys === undefined
      ? { kind: "runtime", value: canonicalValue(handler, new WeakMap(), "$handler", "source") }
      : { kind: "core", registrationKeys: coreRegistrationKeys },
  }))
}

function sortCanonical(values: readonly unknown[]): readonly unknown[] {
  return [...values].sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right), "ru"))
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value, new WeakMap(), "$"))
}

function canonicalValue(
  value: unknown,
  seen: WeakMap<object, string>,
  path: string,
  functionMode: "shape" | "source" = "shape",
): unknown {
  if (value === undefined) return { $undefined: true }
  if (typeof value === "bigint") return { $bigint: value.toString() }
  if (typeof value === "function") {
    if (functionMode === "source") return { $functionSource: Function.prototype.toString.call(value) }
    const constructorName = Object.getPrototypeOf(value)?.constructor?.name
    return {
      $function: {
        arity: value.length,
        async: constructorName === "AsyncFunction" || constructorName === "AsyncGeneratorFunction",
        generator: constructorName === "GeneratorFunction" || constructorName === "AsyncGeneratorFunction",
      },
    }
  }
  if (typeof value === "symbol") return { $symbol: value.description ?? "" }
  if (value === null || typeof value !== "object") return value

  const previousPath = seen.get(value)
  if (previousPath !== undefined) return { $ref: previousPath }
  seen.set(value, path)
  if (Array.isArray(value)) {
    return value.map((entry, index) => canonicalValue(entry, seen, `${path}[${index}]`, functionMode))
  }
  if (value instanceof Date) return { $date: value.toISOString() }
  if (value instanceof RegExp) return { $regexp: value.source, flags: value.flags }
  if (value instanceof Map) {
    return {
      $map: sortCanonical([...value.entries()].map(([key, entry]) => [
        canonicalValue(key, seen, `${path}.<key>`, functionMode),
        canonicalValue(entry, seen, `${path}.<value>`, functionMode),
      ])),
    }
  }
  if (value instanceof Set) {
    return { $set: sortCanonical([...value].map((entry) => canonicalValue(entry, seen, `${path}.<value>`, functionMode))) }
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right, "ru"))
    .map(([key, entry]) => [key, canonicalValue(entry, seen, `${path}.${key}`, functionMode)]))
}

function rulesSourceFingerprint(): string {
  return typeof __NKDK_RULES_SOURCE_FINGERPRINT__ === "string"
    ? __NKDK_RULES_SOURCE_FINGERPRINT__
    : fingerprintRulesSourceTree(new URL("../../", import.meta.url), RULE_SOURCE_ENTRYPOINTS)
}

const RULE_SOURCE_ENTRYPOINTS = [
  "metadata/register.ts",
  "metadata/validation/registerValidationMetadata.ts",
] as const
