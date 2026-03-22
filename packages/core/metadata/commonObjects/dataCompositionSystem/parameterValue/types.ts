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

//#region Property rules

/**
 * Правило свойства для `dcsset:SettingsParameterValue` (расширение `dcscore:ParameterValue` в XSD).
 * Базовый `ParameterValue` в реестре свойств не регистрируется — только этот тип.
 */
export interface SettingsParameterValuePropertyRule extends BasePropertyRule {
  type: "SettingsParameterValue"
  valueType: DcsMetadataValueValueType
  /** Для `SystemEnumeration` — ключ из `SystemEnumerationTypeMap`. */
  typeSE?: keyof SystemEnumerationTypeMap
}

//#endregion

//#region Item (dcscore:ParameterValue → dcsset:SettingsParameterValue)

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

//#endregion

//#region YAML

export type ParameterValueYAMLObject = {
  Параметр?: string
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

//#endregion

//#region XML

/** Один узел `dcscor:value` (см. `MetadataDcsMetadataValueDcsRootXML` в dcsMetadataValue). */
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

//#endregion
