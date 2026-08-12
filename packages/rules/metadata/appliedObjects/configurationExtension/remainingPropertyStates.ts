import { MetadataBotRules } from "../metadataBot/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { MetadataCommonPictureRules } from "../metadataCommonPicture/rules"
import { MetadataCommonTemplateRules } from "../metadataCommonTemplate/rules"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import { MetadataEventSubscriptionRules } from "../metadataEventSubscription/rules"
import { MetadataExternalDataSourceRules } from "../metadataExternalDataSource/rules"
import { MetadataHTTPServiceRules } from "../metadataHTTPService/rules"
import { MetadataIntegrationServiceRules } from "../metadataIntegrationService/rules"
import { MetadataLanguageRules } from "../metadataLanguage/rules"
import { MetadataReportRules } from "../metadataReport/rules"
import { MetadataScheduledJobRules } from "../metadataScheduledJob/rules"
import { MetadataSettingsStorageRules } from "../metadataSettingsStorage/rules"
import { MetadataStyleRules } from "../metadataStyle/rules"
import { MetadataWebServiceRules } from "../metadataWebService/rules"
import { MetadataWebSocketClientRules } from "../metadataWebSocketClient/rules"
import { MetadataWSReferenceRules } from "../metadataWSReference/rules"
import { MetadataXDTOPackageRules } from "../metadataXDTOPackage/rules"
import { defineStandardBorrowedPropertyStates } from "./standardPropertyStates"
import { allPropertyStateModes, definePropertyStateItemCapabilities } from "./propertyStateCapabilities"

export const remainingConfigurationExtensionPropertyStateCapabilities = [
  MetadataEventSubscriptionRules,
  MetadataScheduledJobRules,
  MetadataBotRules,
  MetadataSettingsStorageRules,
  MetadataDataProcessorRules,
  MetadataReportRules,
  MetadataCommonFormRules,
  MetadataCommonPictureRules,
  MetadataCommonTemplateRules,
  MetadataStyleRules,
  MetadataLanguageRules,
  MetadataWebServiceRules,
  MetadataHTTPServiceRules,
  MetadataIntegrationServiceRules,
  MetadataWebSocketClientRules,
  MetadataWSReferenceRules,
  MetadataExternalDataSourceRules,
].map(defineStandardBorrowedPropertyStates)

remainingConfigurationExtensionPropertyStateCapabilities.push(
  definePropertyStateItemCapabilities(MetadataXDTOPackageRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: allPropertyStateModes("namespace", "package"),
  }),
)
