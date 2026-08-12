export interface ConfigurationExtensionStructureCapability {
  readonly itemType: string
  readonly ownObject: boolean
  readonly borrowedChildren?: Readonly<Record<string, "allow-own" | "borrow-only">>
}

export interface ConfigurationExtensionChildIdentity {
  readonly itemType: string
  readonly name: string
}

const forbiddenOwnItemTypes = new Set([
  "MetadataCommonAttribute",
  "MetadataBot",
  "MetadataSettingsStorage",
  "MetadataLanguage",
  "MetadataWebSocketClient",
])

const borrowedChildren: Readonly<Record<string, Readonly<Record<string, "allow-own" | "borrow-only">>>> = {
  MetadataWebService: { operations: "borrow-only" },
  MetadataWebServiceOperation: { parameters: "borrow-only" },
  MetadataHTTPService: { urlTemplates: "borrow-only" },
  MetadataHTTPServiceURLTemplate: { methods: "borrow-only" },
  MetadataIntegrationService: { channels: "allow-own" },
  MetadataDocumentJournal: { columns: "borrow-only" },
  MetadataChartOfCharacteristicTypes: {
    attributes: "borrow-only",
    tabularSections: "borrow-only",
    tabularSectionAttributes: "borrow-only",
  },
  MetadataChartOfAccounts: {
    attributes: "borrow-only",
    accountingFlags: "borrow-only",
    extDimensionAccountingFlags: "borrow-only",
    tabularSections: "borrow-only",
    tabularSectionAttributes: "borrow-only",
  },
  MetadataChartOfCalculationTypes: {
    attributes: "borrow-only",
    tabularSections: "borrow-only",
    tabularSectionAttributes: "borrow-only",
  },
  MetadataInformationRegister: registerFields(),
  MetadataAccumulationRegister: registerFields(),
  MetadataAccountingRegister: registerFields(),
  MetadataCalculationRegister: {
    ...registerFields(),
    recalculations: "borrow-only",
  },
}

export function createConfigurationExtensionStructureRegistry() {
  return {
    resolve(itemType: string): ConfigurationExtensionStructureCapability {
      return {
        itemType,
        ownObject: !forbiddenOwnItemTypes.has(itemType),
        borrowedChildren: borrowedChildren[itemType],
      }
    },
    allowsOwnBorrowedChild(itemType: string, collection: string): boolean {
      return borrowedChildren[itemType]?.[collection] !== "borrow-only"
    },
    classifyChild(
      child: ConfigurationExtensionChildIdentity,
      baseChildren: readonly ConfigurationExtensionChildIdentity[],
    ): "borrowed" | "own" {
      return baseChildren.some((candidate) =>
        candidate.itemType === child.itemType && candidate.name === child.name)
        ? "borrowed"
        : "own"
    },
  }
}

function registerFields(): Readonly<Record<string, "borrow-only">> {
  return {
    attributes: "borrow-only",
    dimensions: "borrow-only",
    resources: "borrow-only",
  }
}
