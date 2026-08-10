import { standardMemberNamePairs, standardMembersRegistryRevision } from "./registry"
import type { DataPathFormatDirection } from "./formatContracts"
import { getRegisteredFormDataPathMetadataProjection } from "../formDataPathProjectionRegistry"

interface CachedMatcher {
  revision: number
  matcher: RegExp | undefined
}

const cachedMatchers: Partial<Record<DataPathFormatDirection, CachedMatcher>> = {}

export function requiresDataPathStandardMemberFormatting(
  value: unknown,
  direction: DataPathFormatDirection
): boolean {
  if (typeof value !== "string" || value.startsWith("~") || !value.includes(".")) return false
  return requiresRegisteredDialectFormatting(value, direction) || (matcher(direction)?.test(value) ?? false)
}

function requiresRegisteredDialectFormatting(value: string, direction: DataPathFormatDirection): boolean {
  const dialect = getRegisteredFormDataPathMetadataProjection()?.dataPathDialect
  if (dialect === undefined) return false
  const segments = value.split(".")
  if (segments.length < 4) return false
  const root = direction === "internal-to-yaml" ? dialect.serviceRoot.internal : dialect.serviceRoot.yaml
  const currentRow = direction === "internal-to-yaml" ? dialect.currentRow.internal : dialect.currentRow.yaml
  return segments[0] === root && segments[2] === currentRow
}

function matcher(direction: DataPathFormatDirection): RegExp | undefined {
  const revision = standardMembersRegistryRevision()
  const cached = cachedMatchers[direction]
  if (cached !== undefined && cached.revision === revision) return cached.matcher

  const nameKey = direction === "internal-to-yaml" ? "internal" : "yaml"
  const names = standardMemberNamePairs()
    .filter(({ internal, yaml }) => internal !== yaml)
    .map((pair) => pair[nameKey])
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
  const compiled = names.length === 0 ? undefined : new RegExp(`(?:^|\\.)(?:${names.join("|")})(?=\\.|\\[|$)`)
  cachedMatchers[direction] = { revision, matcher: compiled }
  return compiled
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
