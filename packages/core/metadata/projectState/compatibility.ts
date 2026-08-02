import { createHash } from "node:crypto"
import { registerCoreMetadata } from "../register"
import { getRegisteredPropertyRuleTypes } from "../orchestration/property/propertyTypeKeys"
import { getRegisteredProjectSpecs } from "../project/projectSpecRegistry"
import { registeredProjectValidationFormRules } from "../validation/projectValidationFormRules"
import { createProjectValidationStandaloneSchemaSet } from "../validation/projectValidationStandaloneSchemas"
import { NKDK_CORE_VERSION } from "../../version"

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

function currentRulesSnapshot(): ProjectStateRulesSnapshot {
  const schemas = createProjectValidationStandaloneSchemaSet()
  return {
    projectSpecs: getRegisteredProjectSpecs().map(({ dir, kind, nesting }) => ({
      dir,
      kind,
      ...(nesting === undefined ? {} : { nesting }),
    })),
    schemas: {
      context: schemas.context,
      forms: schemas.forms,
      refs: schemas.refs,
      byItemType: schemas.byItemType,
    },
    localRules: [
      ...getRegisteredPropertyRuleTypes().map((type) => ({ kind: "property", type })),
      ...registeredProjectValidationFormRules().map(({ key }) => ({ kind: "form", key })),
    ],
  }
}

function sortCanonical(values: readonly unknown[]): readonly unknown[] {
  return [...values].sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right), "ru"))
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value))
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, "ru"))
      .map(([key, entry]) => [key, canonicalValue(entry)]),
  )
}
