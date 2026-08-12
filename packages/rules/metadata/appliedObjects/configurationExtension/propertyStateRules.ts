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
import { CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER } from "./explicitXMLState"
import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"

export const configurationExtensionPropertyStateCapabilities = [
  ...configurationExtensionPropertyStateProfiles,
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

export const configurationExtensionPropertyStateRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyStateCapabilities: configurationExtensionPropertyStateCapabilities,
  explicitXMLProperties: propertyStateXMLCarriers(),
})

function propertyStateXMLCarriers() {
  const registry = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)
  const itemTypes = new Set(configurationExtensionPropertyStateCapabilities.flatMap((contribution) =>
    contribution.item === undefined ? [] : [contribution.item.itemType]))
  return Object.fromEntries([...itemTypes].flatMap((itemType) =>
    Object.keys(registry.item(itemType)?.properties ?? {}).map((propertyKey) => [
      `${itemType}.${propertyKey}`,
      {
        action: "carrier" as const,
        itemType,
        propertyKey,
        prefix: CONFIGURATION_EXTENSION_PROPERTY_STATE_XML_CARRIER,
      },
    ])))
}
