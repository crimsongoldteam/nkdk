import { PlatformSessionError } from "../sessions/errors"
import type {
  ConfigurationExtensionInfo,
  ConfigurationExtensionPurpose,
  ConfigurationExtensionScope,
} from "./types"

const PROPERTY_KEYS = new Set([
  "name",
  "version",
  "active",
  "purpose",
  "safe-mode",
  "security-profile-name",
  "unsafe-action-protection",
  "used-in-distributed-infobase",
  "scope",
  "hash-sum",
])
const PURPOSES = new Set<ConfigurationExtensionPurpose>([
  "customization",
  "add-on",
  "patch",
])
const SCOPES = new Set<ConfigurationExtensionScope>([
  "infobase",
  "data-separation",
])

export function parseExtensionPropertyRecords(
  records: readonly unknown[]
): ConfigurationExtensionInfo[] {
  return records.map(parseExtensionPropertyRecord)
}

export function parseIbcmdExtensionList(
  source: string
): ConfigurationExtensionInfo[] {
  if (source.trim() === "") return []
  try {
    const records = source
      .trim()
      .split(/\r?\n\s*\r?\n/)
      .map(parseIbcmdRecord)
    return parseExtensionPropertyRecords(records)
  } catch (caught) {
    if (caught instanceof PlatformSessionError) throw caught
    throw invalidExtensionProperties()
  }
}

function parseExtensionPropertyRecord(
  value: unknown
): ConfigurationExtensionInfo {
  if (!isRecord(value)) throw invalidExtensionProperties()
  const keys = Object.keys(value)
  if (
    keys.length !== PROPERTY_KEYS.size ||
    keys.some((key) => !PROPERTY_KEYS.has(key))
  ) {
    throw invalidExtensionProperties()
  }
  return {
    name: requiredString(value, "name"),
    version: requiredString(value, "version"),
    active: platformBoolean(value, "active"),
    purpose: enumValue(value, "purpose", PURPOSES),
    safeMode: platformBoolean(value, "safe-mode"),
    securityProfileName: requiredString(value, "security-profile-name"),
    unsafeActionProtection: platformBoolean(
      value,
      "unsafe-action-protection"
    ),
    usedInDistributedInfobase: platformBoolean(
      value,
      "used-in-distributed-infobase"
    ),
    scope: enumValue(value, "scope", SCOPES),
    hashSum: requiredString(value, "hash-sum"),
  }
}

function parseIbcmdRecord(source: string): Record<string, string> {
  const record: Record<string, string> = {}
  for (const line of source.split(/\r?\n/)) {
    const separator = line.indexOf(":")
    if (separator < 0) throw invalidExtensionProperties()
    const key = line.slice(0, separator).trim()
    if (key === "" || Object.hasOwn(record, key)) {
      throw invalidExtensionProperties()
    }
    record[key] = parseIbcmdValue(line.slice(separator + 1).trim())
  }
  return record
}

function parseIbcmdValue(value: string): string {
  if (!value.startsWith('"')) return value
  const parsed: unknown = JSON.parse(value)
  if (typeof parsed !== "string") throw invalidExtensionProperties()
  return parsed
}

function requiredString(
  record: Record<string, unknown>,
  key: string
): string {
  const value = record[key]
  if (typeof value !== "string") throw invalidExtensionProperties()
  return value
}

function platformBoolean(
  record: Record<string, unknown>,
  key: string
): boolean {
  const value = record[key]
  if (typeof value === "boolean") return value
  if (value === "yes") return true
  if (value === "no") return false
  throw invalidExtensionProperties()
}

function enumValue<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<T>
): T {
  const value = requiredString(record, key)
  if (!allowed.has(value as T)) throw invalidExtensionProperties()
  return value as T
}

function invalidExtensionProperties(): PlatformSessionError {
  return new PlatformSessionError(
    "platform_command_failed",
    "Платформа вернула некорректные свойства расширения"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
