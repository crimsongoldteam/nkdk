export * from "@nkdk/runtime/rule-kit"

import type { FormattedI8nText, FormattedI8nTextYAML } from "../../commonObjects/formattedI8nText/types"
import type { I8nText, I8nTextYAML } from "../../commonObjects/i8nText/types"
import type { UserVisible, UserVisibleYAML } from "../../commonObjects/userVisible/types"

export interface PropertyMetadataTypeMap {
  FormattedI8nText: FormattedI8nText
  I8nText: I8nText
  UserVisible: UserVisible
}
export interface PropertyEnterpriseTypeMap {
  I8nText: string
}
export interface PropertyYAMLTypeMap {
  FormattedI8nText: FormattedI8nTextYAML
  I8nText: I8nTextYAML
  UserVisible: UserVisibleYAML
}

type UnregisteredPropertyType<Key extends string> = Key & any

export type PropertyToMetadata<Key extends string> = Key extends keyof PropertyMetadataTypeMap
  ? PropertyMetadataTypeMap[Key]
  : UnregisteredPropertyType<Key>

export type PropertyToEnterprise<Key extends string> = Key extends keyof PropertyEnterpriseTypeMap
  ? PropertyEnterpriseTypeMap[Key]
  : UnregisteredPropertyType<Key>

export type PropertyToYAML<Key extends string> = Key extends keyof PropertyYAMLTypeMap
  ? PropertyYAMLTypeMap[Key]
  : UnregisteredPropertyType<Key>
