import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { PictureXML } from "~/metadata/commonObjects/picture/types"
import { ElementTypeByRule } from "~/metadata/metadataFactory/types/element"
import { YAMLTypeByRule } from "~/metadata/metadataFactory/types/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationRules } from "./rules"

export type Configuration = ElementTypeByRule<typeof ConfigurationRules>

export type ConfigurationYAML = YAMLTypeByRule<typeof ConfigurationRules>

export interface ConfigurationInternalInfoXML {
  "xr:ContainedObject"?: Array<{
    "xr:ClassId": string
    "xr:ObjectId": string
  }>
}

export interface ConfigurationChildObjectsXML {
  Language?: string[]
  Subsystem?: string[]
  Style?: string[]
  Role?: string[]
  SettingsStorage?: string[]
  CommonCommand?: string[]
  CommonForm?: string[]
  Catalog?: string[]
  DataProcessor?: string[]
  [key: string]: string[] | undefined
}

export interface ConfigurationPropertiesXML {
  Name?: string
  Synonym?: I8nTextXML
  Comment?: string
  ConfigurationExtensionCompatibilityMode?: SE.CompatibilityMode
  DefaultRunMode?: SE.ClientRunMode
  ScriptVariant?: SE.ScriptVariant
  DefaultRoles?: { "xr:Item": string | string[] }
  Vendor?: string
  Version?: string
  UpdateCatalogAddress?: string
  IncludeHelpInContents?: boolean
  UseManagedFormInOrdinaryApplication?: boolean
  UseOrdinaryFormInManagedApplication?: boolean
  CommonSettingsStorage?: string
  ReportsUserSettingsStorage?: string
  ReportsVariantsStorage?: string
  FormDataSettingsStorage?: string
  DynamicListsUserSettingsStorage?: string
  URLExternalDataStorage?: string
  DefaultReportForm?: string
  DefaultReportVariantForm?: string
  DefaultReportSettingsForm?: string
  DefaultReportAppearanceTemplate?: string
  DefaultDynamicListSettingsForm?: string
  DefaultSearchForm?: string
  DefaultDataHistoryChangeHistoryForm?: string
  DefaultDataHistoryVersionDataForm?: string
  DefaultDataHistoryVersionDifferencesForm?: string
  DefaultCollaborationSystemUsersChoiceForm?: string
  DefaultConstantsForm?: string
  DefaultLanguage?: string
  DefaultStyle?: string
  DefaultInterface?: string
  BriefInformation?: I8nTextXML
  DetailedInformation?: I8nTextXML
  Copyright?: I8nTextXML
  ConfigurationInformationAddress?: I8nTextXML
  VendorInformationAddress?: I8nTextXML
  DataLockControlMode?: SE.DefaultDataLockControlMode
  ObjectAutonumerationMode?: SE.ObjectAutonumerationMode
  ModalityUseMode?: SE.ModalityUseMode
  SynchronousPlatformExtensionAndAddInCallUseMode?: SE.SynchronousPlatformExtensionAndAddInCallUseMode
  InterfaceCompatibilityMode?: SE.InterfaceCompatibilityMode
  CompatibilityMode?: SE.CompatibilityMode
  MainClientApplicationWindowMode?: SE.MainClientApplicationWindowMode
  AuxiliaryConstantsForm?: string
  BinaryDataBlockStorageUseMode?: string
  BinaryDataStorageMode?: string
  ConfigurationExtensionPurpose?: string
  DatabaseTablespacesUseMode?: string
  KeepMappingToExtendedConfigurationObjectsByIDs?: boolean
  MainSectionPicture?: PictureXML
  SynchronousExtensionAndAddInCallUseMode?: string
}

export interface ConfigurationXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version: string
  Configuration: {
    _uuid: string
    InternalInfo?: ConfigurationInternalInfoXML
    Properties: ConfigurationPropertiesXML
    ChildObjects?: ConfigurationChildObjectsXML
  }
}
