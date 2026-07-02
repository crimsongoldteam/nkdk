import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataBotRules } from "../metadataBot/rules"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataCommonAttributeRules } from "../metadataCommonAttribute/rules"
import { MetadataDefinedTypeRules } from "../metadataDefinedType/rules"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import { MetadataReportRules } from "../metadataReport/rules"
import { MetadataDocumentJournalRules } from "../metadataDocumentJournal/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataHTTPServiceRules } from "../metadataHTTPService/rules"
import { MetadataIntegrationServiceRules } from "../metadataIntegrationService/rules"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { MetadataBusinessProcessRules } from "../metadataBusinessProcess/rules"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import { MetadataExchangePlanRules } from "../metadataExchangePlan/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataEnumerationRules } from "../metadataEnumeration/rules"
import { MetadataEventSubscriptionRules } from "../metadataEventSubscription/rules"
import { MetadataFilterCriterionRules } from "../metadataFilterCriterion/rules"
import { MetadataFunctionalOptionRules } from "../metadataFunctionalOption/rules"
import { MetadataFunctionalOptionsParameterRules } from "../metadataFunctionalOptionsParameter/rules"
import { MetadataLanguageRules } from "../metadataLanguage/rules"
import { MetadataRoleRules } from "../metadataRole/rules"
import { MetadataScheduledJobRules } from "../metadataScheduledJob/rules"
import { MetadataSettingsStorageRules } from "../metadataSettingsStorage/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"
import { MetadataSessionParameterRules } from "../metadataSessionParameter/rules"
import { MetadataCommonCommandRules } from "../metadataCommonCommand/rules"
import { MetadataCommandGroupRules } from "../metadataCommandGroup/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { MetadataCommonPictureRules } from "../metadataCommonPicture/rules"
import { MetadataCommonTemplateRules } from "../metadataCommonTemplate/rules"
import { MetadataCommonModuleRules } from "../metadataCommonModule/rules"
import { MetadataXDTOPackageRules } from "../metadataXDTOPackage/rules"
import { MetadataWebSocketClientRules } from "../metadataWebSocketClient/rules"
import { MetadataExternalDataSourceRules } from "../metadataExternalDataSource/rules"
import { MetadataConstantRules } from "../metadataConstant/rules"
import { MetadataStyleRules } from "../metadataStyle/rules"
import { MetadataStyleItemRules } from "../metadataStyleItem/rules"
import { MetadataSubsystemRules } from "../metadataSubsystem/rules"
import { MetadataTaskRules } from "../metadataTask/rules"
import { MetadataWebServiceRules } from "../metadataWebService/rules"
import { MetadataWSReferenceRules } from "../metadataWSReference/rules"

/**
 * Реестр корневых прикладных объектов, которые обходит configuration walker
 * (`syncConfigurationFromXML`/`syncConfigurationToXML`). Добавление нового
 * корневого типа = одна строка тут + поле `xmlDir` в правиле.
 */
const RawTopLevelMetadataItemRules: readonly MetadataItemRule[] = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDataProcessorRules,
  MetadataReportRules,
  MetadataDocumentJournalRules,
  MetadataHTTPServiceRules,
  MetadataInformationRegisterRules,
  MetadataAccumulationRegisterRules,
  MetadataExchangePlanRules,
  MetadataDocumentNumeratorRules,
  MetadataEnumerationRules,
  MetadataSequenceRules,
  MetadataDefinedTypeRules,
  MetadataSessionParameterRules,
  MetadataEventSubscriptionRules,
  MetadataFilterCriterionRules,
  MetadataFunctionalOptionRules,
  MetadataFunctionalOptionsParameterRules,
  MetadataRoleRules,
  MetadataScheduledJobRules,
  MetadataLanguageRules,
  MetadataCommonTemplateRules,
  MetadataCommonModuleRules,
  MetadataXDTOPackageRules,
  MetadataWebSocketClientRules,
  MetadataExternalDataSourceRules,
  MetadataCommonFormRules,
  MetadataCommonPictureRules,
  MetadataStyleRules,
  MetadataCommonCommandRules,
  MetadataCommandGroupRules,
  MetadataConstantRules,
  MetadataSubsystemRules,
  MetadataAccountingRegisterRules,
  MetadataSettingsStorageRules,
  MetadataStyleItemRules,
  MetadataCommonAttributeRules,
  MetadataBusinessProcessRules,
  MetadataCalculationRegisterRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataChartOfCharacteristicTypesRules,
  MetadataBotRules,
  MetadataIntegrationServiceRules,
  MetadataTaskRules,
  MetadataWebServiceRules,
  MetadataWSReferenceRules,
]

export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = RawTopLevelMetadataItemRules.map((rule) => ({
  ...rule,
  externalMetadata: rule.externalMetadata ?? { segment: getXMLRootContainer(rule), placement: "rootEntry" },
}))

function getXMLRootContainer(rule: MetadataItemRule): string {
  const xmlRootEntry = Object.values(rule.properties).find((propertyRule) => propertyRule.type === "XMLRoot")
  const container = xmlRootEntry && "container" in xmlRootEntry ? xmlRootEntry.container : undefined
  if (typeof container !== "string" || container.length === 0) {
    throw new Error(`Для top-level правила ${rule.itemType} не найден XMLRoot.container`)
  }
  return container
}
