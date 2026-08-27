import type { YamlPath } from "../../diagnostics/types"
import type { DeferredRulePathSegment } from "../property/localFacts"

export interface XmlRuleAddress {
  readonly sourcePath: string
  readonly xmlPath: string
  readonly yamlPath: YamlPath
  readonly rulePath: readonly DeferredRulePathSegment[]
  readonly kind: "property" | "item"
}

export interface XmlRuleAddressIndex {
  deepest(sourcePath: string, xmlPath: string): XmlRuleAddress | undefined
  deepestCandidates(sourcePath: string, xmlPath: string): readonly XmlRuleAddress[]
}

export function createXmlRuleAddressIndex(
  addresses: readonly XmlRuleAddress[],
): XmlRuleAddressIndex {
  const byXmlPath = new Map<string, XmlRuleAddress[]>()
  const uniqueAddresses = new Set<string>()
  for (const address of addresses) {
    const uniqueKey = JSON.stringify(address)
    if (uniqueAddresses.has(uniqueKey)) continue
    uniqueAddresses.add(uniqueKey)
    const key = addressKey(address.sourcePath, address.xmlPath)
    const current = byXmlPath.get(key)
    if (current === undefined) byXmlPath.set(key, [address])
    else current.push(address)
  }

  const deepestCandidates = (
    sourcePath: string,
    xmlPath: string,
  ): readonly XmlRuleAddress[] => {
    let candidatePath = xmlPath
    while (candidatePath.length > 0) {
      const candidates = byXmlPath.get(addressKey(sourcePath, candidatePath))
      if (candidates !== undefined) {
        if (candidatePath === xmlPath) return candidates
        const itemOwners = candidates.filter(({ kind }) => kind === "item")
        return itemOwners.length === 0 ? candidates : itemOwners
      }
      candidatePath = parentXmlPath(candidatePath)
    }
    return []
  }

  return {
    deepest(sourcePath, xmlPath) {
      const candidates = deepestCandidates(sourcePath, xmlPath)
      return candidates.length === 1 ? candidates[0] : undefined
    },
    deepestCandidates,
  }
}

function addressKey(sourcePath: string, xmlPath: string): string {
  return `${sourcePath}\u0000${xmlPath}`
}

function parentXmlPath(path: string): string {
  const separator = path.lastIndexOf("/")
  return separator <= 0 ? "" : path.slice(0, separator)
}
