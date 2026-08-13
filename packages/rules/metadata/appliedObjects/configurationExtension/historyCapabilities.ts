export type ConfigurationExtensionHistoryContribution =
  | { readonly itemType: string; readonly propertyKey: "dataHistory"; readonly availability: "versioned"; readonly sinceMode: string }
  | { readonly itemType: string; readonly propertyKey: "dataHistory"; readonly availability: "alwaysForbidden" | "notApplicable" }

export const configurationExtensionHistoryContributions = [
  versioned("MetadataCatalog", "Версия8_3_11"),
  versioned("MetadataDocument", "Версия8_3_11"),
  versioned("MetadataBusinessProcess", "Версия8_3_11"),
  versioned("MetadataTask", "Версия8_3_11"),
  versioned("MetadataInformationRegister", "Версия8_3_11"),
  versioned("MetadataChartOfCharacteristicTypes", "Версия8_3_12"),
  versioned("MetadataChartOfAccounts", "Версия8_3_12"),
  versioned("MetadataConstant", "Версия8_3_13"),
  versioned("MetadataExchangePlan", "Версия8_3_13"),
  versioned("MetadataChartOfCalculationTypes", "Версия8_3_13"),
  alwaysForbidden("MetadataCommonAttribute"),
  alwaysForbidden("MetadataExternalDataSourceCubeDimension"),
  alwaysForbidden("MetadataExternalDataSourceCubeResource"),
  alwaysForbidden("StandardAttributeDescription"),
] as const satisfies readonly ConfigurationExtensionHistoryContribution[]

export function createConfigurationExtensionHistoryRegistry(
  contributions: readonly ConfigurationExtensionHistoryContribution[] = configurationExtensionHistoryContributions,
) {
  const entries = new Map<string, ConfigurationExtensionHistoryContribution>()
  for (const contribution of contributions) {
    if (entries.has(contribution.itemType)) {
      throw new Error(`Повторная классификация ИсторииДанных: ${contribution.itemType}`)
    }
    entries.set(contribution.itemType, contribution)
  }
  return {
    resolve(itemType: string): ConfigurationExtensionHistoryContribution | undefined {
      return entries.get(itemType)
    },
    itemTypes(): readonly string[] {
      return [...entries.keys()]
    },
  }
}

function versioned(itemType: string, sinceMode: string): ConfigurationExtensionHistoryContribution {
  return { itemType, propertyKey: "dataHistory", availability: "versioned", sinceMode }
}

function alwaysForbidden(itemType: string): ConfigurationExtensionHistoryContribution {
  return { itemType, propertyKey: "dataHistory", availability: "alwaysForbidden" }
}
