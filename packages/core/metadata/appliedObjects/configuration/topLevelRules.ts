import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
import { MetadataCommandGroupRules } from "../metadataCommandGroup/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { MetadataCommonPictureRules } from "../metadataCommonPicture/rules"
import { MetadataCommonTemplateRules } from "../metadataCommonTemplate/rules"
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
export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = [
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
  MetadataCommonFormRules,
  MetadataCommonPictureRules,
  MetadataStyleRules,
  MetadataCommandGroupRules,
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
