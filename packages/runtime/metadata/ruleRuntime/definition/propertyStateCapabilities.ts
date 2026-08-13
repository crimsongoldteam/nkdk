import type {
  PropertyStateCapabilityContribution,
  PropertyStateCapabilityRegistry,
  PropertyStateCompatibilityModeResolver,
  PropertyStatePropertyCapability,
  ResolvedPropertyStateItemCapability,
} from "./contracts"

export function createPropertyStateCapabilityRegistry(
  contributions: readonly PropertyStateCapabilityContribution[],
  compatibilityModes: PropertyStateCompatibilityModeResolver,
): PropertyStateCapabilityRegistry {
  ensureUniqueIds(contributions)
  const profiles = new Map(
    contributions.flatMap((contribution) => contribution.profile === undefined
      ? []
      : [[contribution.id, contribution.profile] as const]),
  )
  const items = new Map(
    contributions.flatMap((contribution) => contribution.item === undefined
      ? []
      : [[contribution.item.itemType, contribution.item] as const]),
  )
  const deltas = contributions.flatMap((contribution) => contribution.delta === undefined
    ? []
    : [contribution.delta])

  const item = (
    itemType: string,
    compatibilityMode?: string,
  ): ResolvedPropertyStateItemCapability | undefined => {
    const selectedMode = compatibilityModes.normalize(compatibilityMode)
    const itemContribution = items.get(itemType)
    if (itemContribution === undefined) return undefined
    const properties: Record<string, PropertyStatePropertyCapability> = {}
    for (const profileId of itemContribution.profiles) {
      const profile = profiles.get(profileId)
      if (profile === undefined) throw new Error(`Не найден профиль PropertyState: ${profileId}`)
      Object.assign(properties, profile.properties)
    }
    Object.assign(properties, itemContribution.properties)
    for (const delta of deltas) {
      if (compatibilityModes.compare(delta.mode, selectedMode) > 0) continue
      const patch = delta.items.find((entry) => entry.itemType === itemType)
      if (patch === undefined) continue
      for (const [propertyKey, propertyPatch] of Object.entries(patch.properties)) {
        const current = properties[propertyKey]
        if (current === undefined) {
          if (propertyPatch.modes === undefined) {
            throw new Error(`Дельта PropertyState не задаёт modes: ${itemType}.${propertyKey}`)
          }
          properties[propertyKey] = propertyPatch as PropertyStatePropertyCapability
          continue
        }
        properties[propertyKey] = { ...current, ...propertyPatch }
      }
    }
    return { itemType, properties }
  }

  return {
    item,
    resolve: ({ itemType, propertyKey, compatibilityMode }) =>
      item(itemType, compatibilityMode)?.properties[propertyKey],
  }
}

function ensureUniqueIds(contributions: readonly PropertyStateCapabilityContribution[]): void {
  const ids = new Set<string>()
  for (const contribution of contributions) {
    if (ids.has(contribution.id)) throw new Error(`Повторная регистрация PropertyState: ${contribution.id}`)
    ids.add(contribution.id)
  }
}
