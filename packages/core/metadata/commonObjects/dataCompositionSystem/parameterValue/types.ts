import { BasePropertyRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import type { I8nText, I8nTextXML, I8nTextYAML } from "../../i8nText/types"
import {
  MetadataSimpleValue,
  MetadataSimpleValueXML,
  MetadataTypedPrimitiveValue,
  MetadataValueType,
} from "../../metadataValue/types"

//#region Property rules

/**
 * Правило свойства для `dcsset:SettingsParameterValue` (расширение `dcscore:ParameterValue` в XSD).
 * Базовый `ParameterValue` в реестре свойств не регистрируется — только этот тип.
 */
export interface SettingsParameterValuePropertyRule extends BasePropertyRule {
  type: "SettingsParameterValue"
  valueType: MetadataValueType
}

//#endregion

//#region Item (dcscore:ParameterValue → dcsset:SettingsParameterValue)

export type ParameterValue = {
  use?: boolean
  parameter: string
  value?: MetadataTypedPrimitiveValue | MetadataTypedPrimitiveValue[]
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
  Значение?: MetadataSimpleValue | MetadataSimpleValue[]
  Элементы?: ParameterValueYAML[]
}

export type ParameterValueYAML = MetadataSimpleValue | ParameterValueYAMLObject

export type SettingsParameterValueYAMLObject = Omit<ParameterValueYAMLObject, "Элементы"> & {
  РежимОтображения?: SE.DataCompositionSettingsItemViewModeYAML
  ИдентификаторПользовательскойНастройки?: string
  ПредставлениеПользовательскойНастройки?: I8nTextYAML | string
  Элементы?: SettingsParameterValueYAML[]
}

export type SettingsParameterValueYAML = MetadataSimpleValue | SettingsParameterValueYAMLObject

//#endregion

//#region XML

export type ParameterValueContentXML = MetadataSimpleValueXML

export type SettingsParameterValueContentXML = ParameterValueContentXML

export type ParameterValueXML = {
  "dcscor:use"?: string | boolean
  "dcscor:parameter": string
  "dcscor:value"?: ParameterValueContentXML | ParameterValueContentXML[]
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}

export type SettingsParameterValueXML = ParameterValueXML & {
  "_xsi:type": "dcsset:SettingsParameterValue"
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
  "dcsset:userSettingID"?: string
  "dcsset:userSettingPresentation"?: I8nTextXML
}

//#endregion
