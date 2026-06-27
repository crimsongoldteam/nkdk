import { CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES } from "./usedMobileApplicationFunctionalities"

const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES_XML = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map(
  (item) => `\t\t\t\t<app:functionality>
\t\t\t\t\t<app:functionality>${item.functionality}</app:functionality>
\t\t\t\t\t<app:use>${item.use}</app:use>
\t\t\t\t</app:functionality>`
).join("\n")

export const CLEAN_CONFIGURATION_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<Configuration uuid="09eafcae-6f19-49b7-9053-0225498fbeac">
\t\t<Properties>
\t\t\t<Name>Конфигурация</Name>
\t\t\t<Synonym/>
\t\t\t<Comment/>
\t\t\t<NamePrefix/>
\t\t\t<ConfigurationExtensionCompatibilityMode>Version8_3_27</ConfigurationExtensionCompatibilityMode>
\t\t\t<DefaultRunMode>ManagedApplication</DefaultRunMode>
\t\t\t<UsePurposes>
\t\t\t\t<v8:Value xsi:type="app:ApplicationUsePurpose">PlatformApplication</v8:Value>
\t\t\t</UsePurposes>
\t\t\t<ScriptVariant>Russian</ScriptVariant>
\t\t\t<DefaultRoles/>
\t\t\t<Vendor/>
\t\t\t<Version/>
\t\t\t<UpdateCatalogAddress/>
\t\t\t<IncludeHelpInContents>false</IncludeHelpInContents>
\t\t\t<UseManagedFormInOrdinaryApplication>false</UseManagedFormInOrdinaryApplication>
\t\t\t<UseOrdinaryFormInManagedApplication>false</UseOrdinaryFormInManagedApplication>
\t\t\t<AdditionalFullTextSearchDictionaries/>
\t\t\t<CommonSettingsStorage/>
\t\t\t<ReportsUserSettingsStorage/>
\t\t\t<ReportsVariantsStorage/>
\t\t\t<FormDataSettingsStorage/>
\t\t\t<DynamicListsUserSettingsStorage/>
\t\t\t<URLExternalDataStorage/>
\t\t\t<Content/>
\t\t\t<DefaultReportForm/>
\t\t\t<DefaultReportVariantForm/>
\t\t\t<DefaultReportSettingsForm/>
\t\t\t<DefaultReportAppearanceTemplate/>
\t\t\t<DefaultDynamicListSettingsForm/>
\t\t\t<DefaultSearchForm/>
\t\t\t<DefaultDataHistoryChangeHistoryForm/>
\t\t\t<DefaultDataHistoryVersionDataForm/>
\t\t\t<DefaultDataHistoryVersionDifferencesForm/>
\t\t\t<DefaultCollaborationSystemUsersChoiceForm/>
\t\t\t<RequiredMobileApplicationPermissions/>
\t\t\t<UsedMobileApplicationFunctionalities>
${CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES_XML}
\t\t\t</UsedMobileApplicationFunctionalities>
\t\t\t<StandaloneConfigurationRestrictionRoles/>
\t\t\t<MobileApplicationURLs/>
\t\t\t<AllowedIncomingShareRequestTypes/>
\t\t\t<MainClientApplicationWindowMode>Normal</MainClientApplicationWindowMode>
\t\t\t<DefaultInterface/>
\t\t\t<DefaultStyle/>
\t\t\t<DefaultLanguage>Language.Русский</DefaultLanguage>
\t\t\t<BriefInformation/>
\t\t\t<DetailedInformation/>
\t\t\t<Copyright/>
\t\t\t<VendorInformationAddress/>
\t\t\t<ConfigurationInformationAddress/>
\t\t\t<DataLockControlMode>Managed</DataLockControlMode>
\t\t\t<ObjectAutonumerationMode>NotAutoFree</ObjectAutonumerationMode>
\t\t\t<ModalityUseMode>DontUse</ModalityUseMode>
\t\t\t<SynchronousPlatformExtensionAndAddInCallUseMode>DontUse</SynchronousPlatformExtensionAndAddInCallUseMode>
\t\t\t<InterfaceCompatibilityMode>Taxi</InterfaceCompatibilityMode>
\t\t\t<DatabaseTablespacesUseMode>DontUse</DatabaseTablespacesUseMode>
\t\t\t<CompatibilityMode>Version8_3_27</CompatibilityMode>
\t\t\t<DefaultConstantsForm/>
\t\t</Properties>
\t\t<ChildObjects>
\t\t\t<Language>Русский</Language>
\t\t</ChildObjects>
\t</Configuration>
</MetaDataObject>`

export const EXPECTED_CLEAN_CONFIGURATION_YAML = [
  "Имя: Конфигурация",
  "ОсновнойЯзык: Русский",
].join("\n")
