export interface ConfigurationExtensionStructureCapability {
  readonly itemType: string
  readonly ownObject: boolean
  readonly sinceMode?: string
  readonly borrowedChildren?: Readonly<Record<string, "allow-own" | "borrow-only">>
}

export interface ConfigurationExtensionStructureContribution extends ConfigurationExtensionStructureCapability {}

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

const ownObjectSince: Readonly<Record<string, string>> = {
  MetadataWebService: "Версия8_3_7", MetadataHTTPService: "Версия8_3_7",
  MetadataWSReference: "Версия8_3_7", MetadataXDTOPackage: "Версия8_3_7",
  MetadataCommonPicture: "Версия8_3_8", MetadataCommonTemplate: "Версия8_3_8",
  MetadataCommonCommand: "Версия8_3_8", MetadataCommandGroup: "Версия8_3_8",
  MetadataCommonForm: "Версия8_3_8", MetadataCommonModule: "Версия8_3_9",
  MetadataRole: "Версия8_3_9", MetadataCatalog: "Версия8_3_11",
  MetadataDocument: "Версия8_3_11", MetadataInformationRegister: "Версия8_3_11",
  MetadataEnumeration: "Версия8_3_12", MetadataChartOfCharacteristicTypes: "Версия8_3_13",
  MetadataChartOfAccounts: "Версия8_3_13", MetadataChartOfCalculationTypes: "Версия8_3_13",
  MetadataAccumulationRegister: "Версия8_3_13", MetadataAccountingRegister: "Версия8_3_13",
  MetadataCalculationRegister: "Версия8_3_13", MetadataSessionParameter: "Версия8_3_14",
  MetadataConstant: "Версия8_3_16", MetadataFunctionalOption: "Версия8_3_16",
  MetadataFunctionalOptionsParameter: "Версия8_3_16", MetadataFilterCriterion: "Версия8_3_16",
  MetadataDefinedType: "Версия8_3_20",
}

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
        ...(ownObjectSince[itemType] === undefined ? {} : { sinceMode: ownObjectSince[itemType] }),
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
