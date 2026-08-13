import { MetadataBotRules } from "../metadataBot/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { MetadataCommonPictureRules } from "../metadataCommonPicture/rules"
import { MetadataCommonTemplateRules } from "../metadataCommonTemplate/rules"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import { MetadataEventSubscriptionRules } from "../metadataEventSubscription/rules"
import { MetadataExternalDataSourceRules } from "../metadataExternalDataSource/rules"
import { MetadataHTTPServiceRules } from "../metadataHTTPService/rules"
import { MetadataIntegrationServiceRules } from "../metadataIntegrationService/rules"
import { MetadataEnumerationRules, MetadataEnumerationValueRules } from "../metadataEnumeration/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"
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
import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "./propertyStateCapabilities"

const externalStateProperties = new Map([
  ["MetadataBot", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataHTTPService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataIntegrationService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataWebService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataWebSocketClient", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataCommonPicture", externalProperty("picture", "Картинка", ["extend"])],
  ["MetadataCommonTemplate", externalProperty("template", "Макет", ["extend"])],
  ["MetadataStyle", externalProperty("style", "Стиль", ["extend"])],
])

export const remainingConfigurationExtensionPropertyStateCapabilities = [
  MetadataEventSubscriptionRules,
  MetadataScheduledJobRules,
  MetadataBotRules,
  MetadataSettingsStorageRules,
  MetadataDataProcessorRules,
  MetadataReportRules,
  MetadataEnumerationRules,
  MetadataSequenceRules,
  MetadataCommonPictureRules,
  MetadataCommonTemplateRules,
  MetadataStyleRules,
  MetadataWebServiceRules,
  MetadataHTTPServiceRules,
  MetadataIntegrationServiceRules,
  MetadataWebSocketClientRules,
  MetadataWSReferenceRules,
  MetadataExternalDataSourceRules,
].map((rule) => {
  const external = externalStateProperties.get(rule.itemType)
  return external === undefined
    ? defineStandardBorrowedPropertyStates(rule)
    : definePropertyStateItemCapabilities(rule, {
        profiles: ["borrowed-base", "mutable-synonym"],
        properties: external,
      })
})

remainingConfigurationExtensionPropertyStateCapabilities.push(
  defineStandardBorrowedPropertyStates(MetadataEnumerationValueRules),
  definePropertyStateItemCapabilities(MetadataCommonFormRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: {
      ...externalProperty("form", "Форма", ["extend"]),
      ...externalProperty("module", "Модуль", ["extend"]),
    },
  }),
  definePropertyStateItemCapabilities(MetadataLanguageRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: controlled("languageCode"),
  }),
  definePropertyStateItemCapabilities(MetadataXDTOPackageRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: {
      ...allPropertyStateModes("namespace"),
      ...externalProperty("package", "Пакет", ["control", "notify", "extend"]),
    },
  }),
)

remainingConfigurationExtensionPropertyStateCapabilities.push({
  kind: "propertyStateCapability",
  id: "item:ClientApplicationForm",
  item: {
    itemType: "ClientApplicationForm",
    profiles: [],
    properties: {
      ...controlled("extendedConfigurationObject"),
      ...externalProperty("form", "Форма", ["extend"]),
    },
  },
})
