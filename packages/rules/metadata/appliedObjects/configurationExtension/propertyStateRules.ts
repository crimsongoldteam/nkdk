import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { metadataBusinessProcessPropertyStateCapabilities } from "../metadataBusinessProcess/propertyStates"
import { metadataAccountingRegisterPropertyStateCapabilities } from "../metadataAccountingRegister/propertyStates"
import { metadataAccumulationRegisterPropertyStateCapabilities } from "../metadataAccumulationRegister/propertyStates"
import { metadataCatalogPropertyStateCapabilities } from "../metadataCatalog/propertyStates"
import { metadataChartOfCalculationTypesPropertyStateCapabilities } from "../metadataChartOfCalculationTypes/propertyStates"
import { metadataChartOfAccountsPropertyStateCapabilities } from "../metadataChartOfAccounts/propertyStates"
import { metadataChartOfCharacteristicTypesPropertyStateCapabilities } from "../metadataChartOfCharacteristicTypes/propertyStates"
import { metadataCommonCommandPropertyStateCapabilities } from "../metadataCommonCommand/propertyStates"
import { metadataCalculationRegisterPropertyStateCapabilities } from "../metadataCalculationRegister/propertyStates"
import { metadataCommandGroupPropertyStateCapabilities } from "../metadataCommandGroup/propertyStates"
import { metadataConstantPropertyStateCapabilities } from "../metadataConstant/propertyStates"
import { metadataDocumentPropertyStateCapabilities } from "../metadataDocument/propertyStates"
import { metadataDocumentNumeratorPropertyStateCapabilities } from "../metadataDocumentNumerator/propertyStates"
import { metadataDocumentJournalPropertyStateCapabilities } from "../metadataDocumentJournal/propertyStates"
import { metadataExchangePlanPropertyStateCapabilities } from "../metadataExchangePlan/propertyStates"
import { metadataTaskPropertyStateCapabilities } from "../metadataTask/propertyStates"
import { metadataInformationRegisterPropertyStateCapabilities } from "../metadataInformationRegister/propertyStates"
import { metadataStyleItemPropertyStateCapabilities } from "../metadataStyleItem/propertyStates"
import { metadataCommandPropertyStateCapabilities } from "../../commonObjects/metadataCommand/propertyStates"
import { metadataExternalDataSourceCubePropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceCube/propertyStates"
import { metadataExternalDataSourceCubeResourcePropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceCubeResource/propertyStates"
import { metadataExternalDataSourceDimensionTablePropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceDimensionTable/propertyStates"
import { metadataExternalDataSourceFieldPropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceField/propertyStates"
import { metadataExternalDataSourceFunctionPropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceFunction/propertyStates"
import { metadataExternalDataSourceTablePropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceTable/propertyStates"
import { metadataDocumentJournalColumnPropertyStateCapabilities } from "../../commonObjects/metadataDocumentJournalColumn/propertyStates"
import { metadataRegisterAttributePropertyStateCapabilities } from "../../commonObjects/metadataRegisterAttribute/propertyStates"
import { metadataRegisterDimensionPropertyStateCapabilities } from "../../commonObjects/metadataRegisterDimension/propertyStates"
import { metadataRegisterResourcePropertyStateCapabilities } from "../../commonObjects/metadataRegisterResource/propertyStates"
import { metadataSequenceDimensionPropertyStateCapabilities } from "../../commonObjects/metadataSequenceDimension/propertyStates"
import { metadataTaskAddressingAttributePropertyStateCapabilities } from "../../commonObjects/metadataTaskAddressingAttribute/propertyStates"
import { metadataAttributePropertyStateCapabilities } from "../../commonObjects/metadataAttribute/propertyStates"
import { configurationExtensionPropertyStateProfiles } from "./propertyStateProfiles"
import { remainingConfigurationExtensionPropertyStateCapabilities } from "./remainingPropertyStates"
import { metadataSubsystemPropertyStateCapabilities } from "../metadataSubsystem/propertyStates"
import { metadataCommonModulePropertyStateCapabilities } from "../metadataCommonModule/propertyStates"
import { metadataRolePropertyStateCapabilities } from "../metadataRole/propertyStates"
import { metadataCommonAttributePropertyStateCapabilities } from "../metadataCommonAttribute/propertyStates"
import { metadataFunctionalOptionPropertyStateCapabilities } from "../metadataFunctionalOption/propertyStates"
import { metadataFunctionalOptionsParameterPropertyStateCapabilities } from "../metadataFunctionalOptionsParameter/propertyStates"
import { metadataDefinedTypePropertyStateCapabilities } from "../metadataDefinedType/propertyStates"
import { metadataFilterCriterionPropertyStateCapabilities } from "../metadataFilterCriterion/propertyStates"
import { metadataSessionParameterPropertyStateCapabilities } from "../metadataSessionParameter/propertyStates"
import { metadataTabularSectionPropertyStateCapabilities } from "../../commonObjects/metadataTabularSection/propertyStates"
import {
  controlled,
  definePropertyStateItemCapabilities,
  extended,
  externalProperty,
} from "./propertyStateCapabilities"
import { MetadataConfigurationExtensionRules } from "./rules"
import type { PropertyStateCapabilityContribution } from "../../ruleRuntime/definition"

const metadataConfigurationExtensionPropertyStateCapabilities = definePropertyStateItemCapabilities(
  MetadataConfigurationExtensionRules,
  {
    properties: {
      ...controlled("compatibilityMode"),
      ...extended("defaultRoles"),
      ...externalProperty("commandInterface", "КомандныйИнтерфейс", ["extend"]),
      ...externalProperty("homePageWorkArea", "РабочаяОбластьНачальнойСтраницы", ["extend"]),
      ...externalProperty("mainSectionCommandInterface", "КомандныйИнтерфейсОсновногоРаздела", ["extend"]),
      ...externalProperty("mainSectionPicture", "КартинкаОсновногоРаздела", ["extend"]),
      ...externalProperty("logo", "Логотип", ["extend"]),
      ...externalProperty("splash", "Заставка", ["extend"]),
    },
  },
)

const propertyStateCompatibilityDeltas = [
  {
    kind: "propertyStateCapability" as const,
    id: "configuration-default-roles-8.3.14",
    delta: {
      mode: "Версия8_3_14",
      items: [{
        itemType: "MetadataConfigurationExtension",
        properties: extended("defaultRoles"),
      }],
    },
  },
  {
    kind: "propertyStateCapability" as const,
    id: "attribute-type-8.3.18",
    delta: {
      mode: "Версия8_3_18",
      items: [
        "MetadataAttribute",
        "MetadataRegisterAttribute",
        "MetadataRegisterDimension",
        "MetadataRegisterResource",
        "MetadataSequenceDimension",
        "MetadataTaskAddressingAttribute",
      ].map((itemType) => ({
        itemType,
        properties: {
          type: {
            availability: "borrowed" as const,
            modes: ["control", "notify", "extend", "multi"] as const,
            representation: "multi" as const,
          },
        },
      })),
    },
  },
] as const

const CONTROLLED_TYPE_ITEMS = new Set([
  "MetadataAttribute",
  "MetadataRegisterAttribute",
  "MetadataRegisterDimension",
  "MetadataRegisterResource",
  "MetadataSequenceDimension",
  "MetadataTaskAddressingAttribute",
])

const currentPropertyStateCapabilities = [
  ...configurationExtensionPropertyStateProfiles,
  metadataConfigurationExtensionPropertyStateCapabilities,
  metadataCatalogPropertyStateCapabilities,
  metadataExchangePlanPropertyStateCapabilities,
  metadataDocumentPropertyStateCapabilities,
  metadataDocumentNumeratorPropertyStateCapabilities,
  metadataChartOfCharacteristicTypesPropertyStateCapabilities,
  metadataChartOfCalculationTypesPropertyStateCapabilities,
  metadataBusinessProcessPropertyStateCapabilities,
  metadataTaskPropertyStateCapabilities,
  metadataCalculationRegisterPropertyStateCapabilities,
  metadataAccountingRegisterPropertyStateCapabilities,
  metadataAccumulationRegisterPropertyStateCapabilities,
  metadataInformationRegisterPropertyStateCapabilities,
  metadataChartOfAccountsPropertyStateCapabilities,
  metadataDocumentJournalPropertyStateCapabilities,
  metadataConstantPropertyStateCapabilities,
  metadataStyleItemPropertyStateCapabilities,
  metadataCommandGroupPropertyStateCapabilities,
  metadataCommandPropertyStateCapabilities,
  metadataCommonCommandPropertyStateCapabilities,
  metadataExternalDataSourceTablePropertyStateCapabilities,
  metadataExternalDataSourceFieldPropertyStateCapabilities,
  metadataExternalDataSourceCubePropertyStateCapabilities,
  metadataExternalDataSourceDimensionTablePropertyStateCapabilities,
  metadataExternalDataSourceCubeResourcePropertyStateCapabilities,
  metadataExternalDataSourceFunctionPropertyStateCapabilities,
  metadataRegisterAttributePropertyStateCapabilities,
  metadataRegisterDimensionPropertyStateCapabilities,
  metadataRegisterResourcePropertyStateCapabilities,
  metadataSequenceDimensionPropertyStateCapabilities,
  metadataDocumentJournalColumnPropertyStateCapabilities,
  metadataTaskAddressingAttributePropertyStateCapabilities,
  metadataAttributePropertyStateCapabilities,
  metadataTabularSectionPropertyStateCapabilities,
  metadataSubsystemPropertyStateCapabilities,
  metadataCommonModulePropertyStateCapabilities,
  metadataRolePropertyStateCapabilities,
  metadataCommonAttributePropertyStateCapabilities,
  metadataFunctionalOptionPropertyStateCapabilities,
  metadataFunctionalOptionsParameterPropertyStateCapabilities,
  metadataDefinedTypePropertyStateCapabilities,
  metadataFilterCriterionPropertyStateCapabilities,
  metadataSessionParameterPropertyStateCapabilities,
  ...remainingConfigurationExtensionPropertyStateCapabilities,
] as const

export const configurationExtensionPropertyStateCapabilities = [
  ...propertyStateBaseContributions(currentPropertyStateCapabilities),
  propertyStateIntroductionDelta(currentPropertyStateCapabilities),
  propertyStateNotifyDelta(currentPropertyStateCapabilities),
  ...propertyStateCompatibilityDeltas,
] as const

export const configurationExtensionPropertyStateRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyStateCapabilities: configurationExtensionPropertyStateCapabilities,
})

function propertyStateIntroductionDelta(
  contributions: readonly PropertyStateCapabilityContribution[],
): PropertyStateCapabilityContribution {
  const profiles = propertyStateProfiles(contributions)
  return {
    kind: "propertyStateCapability",
    id: "property-state-overrides-8.3.8",
    delta: {
      mode: "Версия8_3_8",
      items: contributions.flatMap((contribution) => {
        const item = contribution.item
        if (item === undefined) return []
        const properties = resolvedItemProperties(item, profiles)
        const borrowed = Object.fromEntries(Object.entries(properties)
          .filter(([, property]) => property.availability !== "own")
          .map(([propertyKey, property]) => [propertyKey, {
            ...property,
            modes: property.modes.filter((mode) => mode !== "notify"),
          }]))
        if (item.itemType === "MetadataConfigurationExtension") delete borrowed.defaultRoles
        const normalizedBorrowed = CONTROLLED_TYPE_ITEMS.has(item.itemType) && borrowed.type !== undefined
          ? { ...borrowed, type: controlled("type").type! }
          : borrowed
        return Object.keys(borrowed).length === 0
          ? []
          : [{ itemType: item.itemType, properties: normalizedBorrowed }]
      }),
    },
  }
}

function propertyStateNotifyDelta(
  contributions: readonly PropertyStateCapabilityContribution[],
): PropertyStateCapabilityContribution {
  const profiles = propertyStateProfiles(contributions)
  return {
    kind: "propertyStateCapability",
    id: "property-state-notify-8.3.15",
    delta: {
      mode: "Версия8_3_15",
      items: contributions.flatMap((contribution) => {
        const item = contribution.item
        if (item === undefined) return []
        const properties = Object.fromEntries(Object.entries(resolvedItemProperties(item, profiles))
          .filter(([, property]) => property.availability !== "own" && property.modes.includes("notify"))
          .map(([propertyKey, property]) => [propertyKey,
            CONTROLLED_TYPE_ITEMS.has(item.itemType) && propertyKey === "type"
              ? controlled("type").type!
              : property]))
        return Object.keys(properties).length === 0 ? [] : [{ itemType: item.itemType, properties }]
      }),
    },
  }
}

function propertyStateBaseContributions(
  contributions: readonly PropertyStateCapabilityContribution[],
): PropertyStateCapabilityContribution[] {
  const profiles = propertyStateProfiles(contributions)
  return contributions.map((contribution) => {
    const item = contribution.item
    if (item === undefined) return contribution
    const properties = resolvedItemProperties(item, profiles)
    return {
      ...contribution,
      item: {
        ...item,
        profiles: [],
        properties: Object.fromEntries(Object.entries(properties).filter(([, property]) =>
          property.availability === "own")),
      },
    }
  })
}

function propertyStateProfiles(contributions: readonly PropertyStateCapabilityContribution[]) {
  return new Map(contributions.flatMap((contribution) => contribution.profile === undefined
    ? []
    : [[contribution.id, contribution.profile] as const]))
}

function resolvedItemProperties(
  item: NonNullable<PropertyStateCapabilityContribution["item"]>,
  profiles: ReturnType<typeof propertyStateProfiles>,
) {
  return Object.assign(
    {},
    ...item.profiles.map((profileId) => profiles.get(profileId)?.properties ?? {}),
    item.properties ?? {},
  ) as Record<string, import("../../ruleRuntime/definition").PropertyStatePropertyCapability>
}
