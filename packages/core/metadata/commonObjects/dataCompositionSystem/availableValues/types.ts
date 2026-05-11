import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type { MetadataDcsMetadataValue, MetadataDcsMetadataValueYAML } from "../dcsMetadataValue/types"

export interface DcsAvailableValue {
  itemType: "DcsAvailableValue"
  value?: MetadataDcsMetadataValue
  presentation?: I8nText | string
}

export interface DcsAvailableValueYAML {
  Значение?: MetadataDcsMetadataValueYAML
  Представление?: I8nTextYAML | string
}

export type DcsAvailableValues = DcsAvailableValue[]

export type DcsAvailableValuesYAML = DcsAvailableValueYAML[]
