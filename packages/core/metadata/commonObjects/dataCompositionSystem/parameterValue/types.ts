import { BasePropertyRule } from "~/metadata/orchestration"
import type { SystemEnumerationTypeMap } from "~/metadata/systemEnumerations/types"
import * as SE from "~/metadata/systemEnumerations/types"
import type { I8nText, I8nTextXML, I8nTextYAML } from "../../i8nText/types"
import type {
  DcsMetadataValueValueType,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueDcsRootXML,
  MetadataDcsMetadataValueYAML,
} from "../dcsMetadataValue/types"

export interface SettingsParameterValuePropertyRule extends BasePropertyRule {
  type: "SettingsParameterValue"
  valueType: DcsMetadataValueValueType
  typeSE?: keyof SystemEnumerationTypeMap
  /** Экспортировать `xsi:type="dcsset:SettingsParameterValue"` для узла `dcscor:item`. По умолчанию: `true`. */
  exportSettingsXsiType?: boolean
}

export type ParameterValue = {
  use?: boolean
  parameter: string
  value?: MetadataDcsMetadataValue | MetadataDcsMetadataValue[]
  item?: ParameterValue[]
}

export type SettingsParameterValue = ParameterValue & {
  viewMode?: SE.DataCompositionSettingsItemViewMode
  userSettingID?: string
  userSettingPresentation?: I8nText
}

export type ParameterValueYAMLObject = {
  Использовать?: "Ложь"
  Значение?: MetadataDcsMetadataValueYAML | MetadataDcsMetadataValueYAML[]
  Элементы?: ParameterValueYAML[]
}

export type ParameterValueYAML = MetadataDcsMetadataValueYAML | ParameterValueYAMLObject

export type SettingsParameterValueYAMLObject = Omit<ParameterValueYAMLObject, "Элементы"> & {
  РежимОтображения?: SE.DataCompositionSettingsItemViewModeYAML
  ИдентификаторПользовательскойНастройки?: string
  ПредставлениеПользовательскойНастройки?: I8nTextYAML | string
  Элементы?: SettingsParameterValueYAML[]
}

export type SettingsParameterValueYAML = MetadataDcsMetadataValueYAML | SettingsParameterValueYAMLObject

export type ParameterValueDcsValueFragment = NonNullable<MetadataDcsMetadataValueDcsRootXML["dcscor:value"]>

export type ParameterValueXML = {
  "_xsi:type"?: string
  "dcscor:use"?: string | boolean
  "dcscor:parameter": string
  "dcscor:value"?: ParameterValueDcsValueFragment | ParameterValueDcsValueFragment[]
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}

export type SettingsParameterValueXML = ParameterValueXML & {
  "_xsi:type": "dcsset:SettingsParameterValue"
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
  "dcsset:userSettingID"?: string
  "dcsset:userSettingPresentation"?: I8nTextXML
}
