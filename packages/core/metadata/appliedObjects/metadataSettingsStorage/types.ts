import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataSettingsStorageRules } from "./rules"

export type MetadataSettingsStorage = MetadataTypeByRule<typeof MetadataSettingsStorageRules>
export type MetadataSettingsStorageYAML = YAMLTypeByRule<typeof MetadataSettingsStorageRules>

export type SettingsStorageInternalInfoParamsXML = [{ name: string; category: "Manager" }]

export interface MetadataSettingsStorageXML {
  _version: string
  SettingsStorage: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<SettingsStorageInternalInfoParamsXML> | undefined
    Properties: {
      AuxiliaryLoadForm?: string
      AuxiliarySaveForm?: string
      Comment?: string
      DefaultLoadForm?: string
      DefaultSaveForm?: string
      ExtendedConfigurationObject?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
    }
    ChildObjects?: {
      Form?: string | string[]
      Template?: string | string[]
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataSettingsStorage",
  itemRule: MetadataSettingsStorageRules,
})
