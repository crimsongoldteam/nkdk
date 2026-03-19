import { Color } from "../color/types"
import { Font } from "../font/types"
import { I8nText } from "../i8nText/types"
import {
  DataCompositionComparisonType,
  DataCompositionConditionalAppearanceUse,
  DataCompositionFilterApplicationType,
  DataCompositionFilterItemsGroupType,
  DataCompositionSettingsItemViewMode,
  HorizontalAlign,
} from "~/metadata/systemEnumerations/types"

export type DataCompositionField = string

export type DataCompositionParameter = string

export type DataCompositionPresentation = I8nText | string | number | boolean | null | Record<string, unknown>

// XSD models these fields as xs:anyType, but conditional appearance fixtures
// currently use a small set of known value shapes plus simple primitives.
export type DataCompositionValue =
  | string
  | number
  | boolean
  | null
  | I8nText
  | Color
  | Font
  | HorizontalAlign
  | Record<string, unknown>

export interface DataCompositionUserSetting {
  viewMode?: DataCompositionSettingsItemViewMode
  userSettingID?: string
  userSettingPresentation?: DataCompositionPresentation
}

export interface DataCompositionIdentifiedItem {
  iID?: number
}

export interface DataCompositionParameterValue {
  use?: boolean
  parameter: DataCompositionParameter
  value?: DataCompositionValue[]
  item?: DataCompositionParameterValue[]
}

export interface SettingsParameterValue
  extends DataCompositionParameterValue,
    DataCompositionUserSetting {}

export interface DataCompositionAppearance {
  item?: SettingsParameterValue[]
}

export interface AppearanceField extends DataCompositionIdentifiedItem {
  use?: boolean
  field: DataCompositionField
}

export interface AppearanceFields {
  item?: AppearanceField[]
}

export interface Filter extends DataCompositionUserSetting {
  item?: FilterItem[]
}

export interface FilterItemComparison
  extends DataCompositionUserSetting,
    DataCompositionIdentifiedItem {
  use?: boolean
  left?: DataCompositionValue
  comparisonType: DataCompositionComparisonType
  right?: DataCompositionValue[]
  presentation?: DataCompositionPresentation
  application?: DataCompositionFilterApplicationType
}

export interface FilterItemGroup extends DataCompositionUserSetting, DataCompositionIdentifiedItem {
  use?: boolean
  groupType: DataCompositionFilterItemsGroupType
  item?: FilterItem[]
  presentation?: DataCompositionPresentation
  application?: DataCompositionFilterApplicationType
}

export type FilterItem = FilterItemComparison | FilterItemGroup

export interface ConditionalAppearanceItem
  extends DataCompositionUserSetting,
    DataCompositionIdentifiedItem {
  use?: boolean
  selection?: AppearanceFields
  filter?: Filter
  appearance?: DataCompositionAppearance
  presentation?: DataCompositionPresentation
  useInGroup?: DataCompositionConditionalAppearanceUse
  useInHierarchicalGroup?: DataCompositionConditionalAppearanceUse
  useInOverall?: DataCompositionConditionalAppearanceUse
  useInFieldsHeader?: DataCompositionConditionalAppearanceUse
  useInHeader?: DataCompositionConditionalAppearanceUse
  useInParameters?: DataCompositionConditionalAppearanceUse
  useInFilter?: DataCompositionConditionalAppearanceUse
  useInResourceFieldsHeader?: DataCompositionConditionalAppearanceUse
  useInOverallHeader?: DataCompositionConditionalAppearanceUse
  useInOverallResourceFieldsHeader?: DataCompositionConditionalAppearanceUse
}

export interface ConditionalAppearance extends DataCompositionUserSetting {
  item?: ConditionalAppearanceItem[]
}
