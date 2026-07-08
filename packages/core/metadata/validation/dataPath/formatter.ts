import type { FormDataPathIndex } from "./formIndex"
import { resolveDataPathCore, type TableContext } from "./coreResolver"
import type { OwnerMetadataCache } from "./ownerCache"

export type DataPathFormatDirection = "internal-to-yaml" | "yaml-to-internal"

export interface FormatDataPathStandardMembersParams {
  value: string
  direction: DataPathFormatDirection
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export function formatDataPathStandardMembers(params: FormatDataPathStandardMembersParams): string {
  const { prefix, value } = splitDisabledPrefix(params.value)
  const result = resolveDataPathCore({
    value,
    nameMode: params.direction === "yaml-to-internal" ? "yaml" : "internal",
    index: params.index,
    ownerCache: params.ownerCache,
    ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
  })

  if (result.status === "error" || result.replacements.length === 0) return params.value

  const segments = value.split(".")
  for (const replacement of result.replacements) {
    const segment = segments[replacement.segmentIndex]
    if (segment === undefined) continue
    const suffix = segment.slice(replacement.from.length)
    segments[replacement.segmentIndex] = `${replacement.to}${suffix}`
  }
  return `${prefix}${segments.join(".")}`
}

function splitDisabledPrefix(value: string): { prefix: string; value: string } {
  if (value.startsWith("~")) return { prefix: "~", value: value.slice(1) }
  return { prefix: "", value }
}
