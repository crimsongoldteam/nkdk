import type {
  XmlRuleAddress,
  XmlRuleAddressIndex,
  XmlStructureDifference,
} from "@nkdk/runtime"

export interface LocalizedXmlDifference {
  readonly difference: XmlStructureDifference
  readonly address: XmlRuleAddress
}

export type UnlocalizedXmlDifferenceReason =
  | "no-rule-address"
  | "ambiguous-item"
  | "unresolved-export-claim"

export interface UnlocalizedXmlDifference {
  readonly difference: XmlStructureDifference
  readonly nearestAddresses: readonly XmlRuleAddress[]
  readonly reason: UnlocalizedXmlDifferenceReason
}

export function localizeXmlDifferences(params: {
  readonly sourcePath: string
  readonly differences: readonly XmlStructureDifference[]
  readonly addressIndex: XmlRuleAddressIndex
}): {
  readonly localized: readonly LocalizedXmlDifference[]
  readonly unlocalized: readonly UnlocalizedXmlDifference[]
} {
  const localized: LocalizedXmlDifference[] = []
  const unlocalized: UnlocalizedXmlDifference[] = []
  for (const difference of params.differences) {
    const nearestAddresses = params.addressIndex.deepestCandidates(
      params.sourcePath,
      difference.path,
    )
    if (nearestAddresses.length === 1) {
      localized.push({ difference, address: nearestAddresses[0]! })
      continue
    }
    unlocalized.push({
      difference,
      nearestAddresses,
      reason: nearestAddresses.length === 0 ? "no-rule-address" : "ambiguous-item",
    })
  }
  return { localized, unlocalized }
}
