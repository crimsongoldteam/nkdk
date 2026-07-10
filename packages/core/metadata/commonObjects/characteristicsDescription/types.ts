import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { Type } from "typebox"
import { MetadataField, MetadataFieldJSONSchema, MetadataFieldYAML } from "../metadataField/types"
import { MetadataItemLink, MetadataItemLinkYAML } from "../metadataRef/types"
import {
  MetadataValue,
  MetadataValueJSONSchema,
  MetadataValuePropertyRule,
  MetadataValueXML,
  MetadataValueYAML,
} from "../metadataValue/types"

export interface CharacteristicsDescription {
  itemType?: "CharacteristicsDescription"
  characteristicTypes?: MetadataItemLink
  characteristicValues?: MetadataItemLink
  dataPathField?: MetadataField
  keyField?: MetadataField
  multipleValuesKeyField?: MetadataField
  multipleValuesOrderField?: MetadataField
  multipleValuesUseField?: MetadataField
  objectField?: MetadataField
  typeField?: MetadataField
  typesFilterField?: MetadataField
  typesFilterValue?: MetadataValue
  valueField?: MetadataField
}

export interface CharacteristicsDescriptionXML {
  "xr:CharacteristicTypes"?: {
    _from?: string
    "xr:KeyField"?: string
    "xr:TypesFilterField"?: string
    "xr:TypesFilterValue"?: MetadataValueXML<MetadataValuePropertyRule, MetadataValue>
    "xr:DataPathField"?: string
    "xr:MultipleValuesUseField"?: string
  }
  "xr:CharacteristicValues"?: {
    _from?: string
    "xr:ObjectField"?: string
    "xr:TypeField"?: string
    "xr:ValueField"?: string
    "xr:MultipleValuesKeyField"?: string
    "xr:MultipleValuesOrderField"?: string
  }
}

export interface CharacteristicsDescriptionYAML {
  ВидыХарактеристик?: MetadataItemLinkYAML
  ЗначениеОтбораВидов?: MetadataValueYAML
  ЗначенияХарактеристик?: MetadataItemLinkYAML
  ПолеВида?: MetadataFieldYAML
  ПолеЗначения?: MetadataFieldYAML
  ПолеИспользованияМножественныхЗначений?: MetadataFieldYAML
  ПолеКлюча?: MetadataFieldYAML
  ПолеКлючаМножественныхЗначений?: MetadataFieldYAML
  ПолеОбъекта?: MetadataFieldYAML
  ПолеОтбораВидов?: MetadataFieldYAML
  ПолеПорядкаМножественныхЗначений?: MetadataFieldYAML
  ПолеПутиКДанным?: MetadataFieldYAML
}

export type CharacteristicsDescriptions = CharacteristicsDescription[]

export type CharacteristicsDescriptionsXML = { "xr:Characteristic": CharacteristicsDescriptionXML[] }

export const CharacteristicsDescriptionJSONSchema = Type.Object({
  ВидыХарактеристик: Type.Optional(Type.String()),
  ЗначениеОтбораВидов: Type.Optional(MetadataValueJSONSchema),
  ЗначенияХарактеристик: Type.Optional(Type.String()),
  ПолеВида: Type.Optional(MetadataFieldJSONSchema),
  ПолеЗначения: Type.Optional(MetadataFieldJSONSchema),
  ПолеИспользованияМножественныхЗначений: Type.Optional(MetadataFieldJSONSchema),
  ПолеКлюча: Type.Optional(MetadataFieldJSONSchema),
  ПолеКлючаМножественныхЗначений: Type.Optional(MetadataFieldJSONSchema),
  ПолеОбъекта: Type.Optional(MetadataFieldJSONSchema),
  ПолеОтбораВидов: Type.Optional(MetadataFieldJSONSchema),
  ПолеПорядкаМножественныхЗначений: Type.Optional(MetadataFieldJSONSchema),
  ПолеПутиКДанным: Type.Optional(MetadataFieldJSONSchema),
})
export const CharacteristicsDescriptionsJSONSchema = Type.Array(CharacteristicsDescriptionJSONSchema)
export type CharacteristicsDescriptionsYAML = CharacteristicsDescriptionYAML[]

export interface CharacteristicsDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "CharacteristicsDescriptions"
}

export type CharacteristicsDescriptionsRuleParams = Omit<CharacteristicsDescriptionsWidePropertyRule, "type">

export function characteristicsDescriptionsRule<const Params extends CharacteristicsDescriptionsRuleParams>(
  params: WideExactRuleParams<CharacteristicsDescriptionsRuleParams, Params>
): Readonly<{ type: "CharacteristicsDescriptions" } & Params> {
  return defineWidePropertyRule("CharacteristicsDescriptions", params)
}
