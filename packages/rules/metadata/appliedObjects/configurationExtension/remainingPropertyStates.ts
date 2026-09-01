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
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../../commonObjects/accountingFlag/rules"
import { MetadataExternalDataSourceCubeDimensionRules } from "../../commonObjects/metadataExternalDataSourceCubeDimension/rules"
import { MetadataHTTPServiceMethodRules } from "../../commonObjects/metadataHTTPServiceMethod/rules"
import { MetadataHTTPServiceURLTemplateRules } from "../../commonObjects/metadataHTTPServiceURLTemplate/rules"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "../../commonObjects/metadataWebServiceOperation/rules"
import { defineStandardBorrowedPropertyStates } from "./standardPropertyStates"
import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "./propertyStateCapabilities"

const externalStateProperties = new Map([
  ["MetadataBot", {
    ...externalProperty("module", "Модуль", ["extend"]),
    picture: presentProperty(),
  }],
  ["MetadataHTTPService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataIntegrationService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataWebService", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataWebSocketClient", externalProperty("module", "Модуль", ["extend"])],
  ["MetadataCommonPicture", externalProperty("picture", "Картинка", ["extend"])],
  ["MetadataCommonTemplate", externalProperty("template", "Макет", ["extend"])],
  ["MetadataStyle", externalProperty("style", "Стиль", ["extend"])],
])

const presenceProperties = new Map<string, Record<string, {
  availability: "borrowed" | "own"
  modes: readonly []
  representation: "plain"
}>>([
  ["MetadataDataProcessor", { extendedPresentation: presentProperty() }],
  ["MetadataEventSubscription", { source: presentProperty() }],
  ["MetadataReport", {
    mainDataCompositionSchema: presentProperty(),
    extendedPresentation: presentProperty(),
    defaultForm: presentProperty(),
    defaultSettingsForm: presentProperty(),
    defaultVariantForm: presentProperty(),
    auxiliaryForm: { availability: "own", modes: [], representation: "plain" },
    auxiliarySettingsForm: { availability: "own", modes: [], representation: "plain" },
  }],
  ["MetadataWebService", { xdtoPackages: presentProperty() }],
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
  const presence = presenceProperties.get(rule.itemType)
  return external === undefined && presence === undefined
    ? defineStandardBorrowedPropertyStates(rule)
    : definePropertyStateItemCapabilities(rule, {
        profiles: ["borrowed-base", "mutable-synonym"],
        properties: { ...external, ...presence },
      })
})

remainingConfigurationExtensionPropertyStateCapabilities.push(
  defineStandardBorrowedPropertyStates(MetadataEnumerationValueRules),
  definePropertyStateItemCapabilities(AccountingFlagRules, {
    profiles: ["borrowed-base", "typed-field"],
    properties: {},
  }),
  definePropertyStateItemCapabilities(ExtDimensionAccountingFlagRules, {
    profiles: ["borrowed-base", "typed-field"],
    properties: {},
  }),
  definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeDimensionRules, {
    profiles: ["borrowed-base", "typed-field"],
    properties: {},
  }),
  defineStandardBorrowedPropertyStates(MetadataHTTPServiceURLTemplateRules),
  defineStandardBorrowedPropertyStates(MetadataHTTPServiceMethodRules),
  defineStandardBorrowedPropertyStates(MetadataWebServiceOperationRules),
  defineStandardBorrowedPropertyStates(MetadataWebServiceParameterRules),
  definePropertyStateItemCapabilities(MetadataCommonFormRules, {
    profiles: ["borrowed-base", "mutable-synonym"],
    properties: {
      ...externalProperty("form", "Форма", ["extend"]),
      ...externalProperty("module", "Модуль", ["extend"]),
      extendedPresentation: presentProperty(),
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
      childItems: { availability: "own", modes: [] },
      commands: { availability: "own", modes: [] },
      parameters: { availability: "own", modes: [] },
      ...controlled("extendedPresentation"),
      ...controlled("extendedConfigurationObject"),
      ...externalProperty("form", "Форма", ["extend"]),
    },
  },
})

function presentProperty() {
  return { availability: "borrowed", modes: [], representation: "plain" } as const
}
