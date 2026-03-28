import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { TypeLinkXML } from "~/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinksXML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "~/metadata/orchestration/property/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChoiceParametersXML } from "../сhoiceParameters/types"
import { StandardAttributeDescriptionRules } from "./rules"

export const StandartAttributeNameToYAML = {
  Owner: "Владелец",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Code: "Код",
  Description: "Наименование",
  DeletionMark: "ПометкаУдаления",
  Predefined: "Предопределенный",
  Parent: "Родитель",
  Ref: "Ссылка",
  IsFolder: "ЭтоГруппа",
  LineNumber: "НомерСтроки",
  Active: "Активность",
  Recorder: "Регистратор",
  Period: "Период",
} as const

export const StandartAttributeNameFromYAML = (name: string): StandartAttributeName => {
  return Object.keys(StandartAttributeNameToYAML).find(
    (key) => StandartAttributeNameToYAML[key as StandartAttributeName] === name
  ) as StandartAttributeName
}

export type StandartAttributeName = keyof typeof StandartAttributeNameToYAML
export type StandartAttributeYAML = (typeof StandartAttributeNameToYAML)[keyof typeof StandartAttributeNameToYAML]

// export const PredefinedNameToYAML

export type StandardAttributeDescription = MetadataTypeByRule<typeof StandardAttributeDescriptionRules>

export interface StandardAttributeDescriptionXML {
  _name: StandartAttributeName
  "xr:ChoiceForm"?: string
  "xr:ChoiceHistoryOnInput"?: SE.ChoiceHistoryOnInput
  "xr:ChoiceParameterLinks"?: ChoiceParameterLinksXML
  "xr:ChoiceParameters"?: ChoiceParametersXML
  "xr:Comment"?: string
  "xr:CreateOnInput"?: SE.CreateOnInput
  "xr:DataHistory"?: SE.DataHistoryUse
  "xr:EditFormat"?: I8nTextXML
  "xr:ExtendedEdit"?: boolean
  "xr:FillChecking"?: SE.FillChecking
  "xr:FillFromFillingValue"?: boolean
  "xr:FillValue"?: MetadataValueXML
  "xr:Format"?: I8nTextXML
  "xr:FullTextSearch"?: SE.UseFullTextSearch
  "xr:LinkByType"?: TypeLinkXML
  "xr:MarkNegatives"?: boolean
  "xr:Mask"?: string
  "xr:MaxValue"?: number
  "xr:MinValue"?: number
  "xr:MultiLine"?: boolean
  "xr:PasswordMode"?: boolean
  "xr:QuickChoice"?: SE.UseQuickChoice
  "xr:Synonym"?: I8nTextXML
  "xr:ToolTip"?: I8nTextXML
  "xr:Type"?: TypeDescriptionXML
  "xr:TypeReductionMode"?: SE.TypeReductionMode
}

export type StandardAttributeDescriptionYAML = YAMLTypeByRule<typeof StandardAttributeDescriptionRules>

export type StandardAttributeDescriptions = StandardAttributeDescription[]

export type StandardAttributeDescriptionsXML = { "xr:StandardAttribute": StandardAttributeDescriptionXML[] }

export type StandardAttributeDescriptionsYAML = Partial<Record<StandartAttributeYAML, StandardAttributeDescriptionYAML>>

registerMetadataItemCollectionRule({
  propertyType: "StandardAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: "xr:StandardAttribute",
  // nameFromYAMLKey: (yamlKey) => StandartAttributeNameFromYAML(yamlKey),
  // yamlKeyFromName: (name) => StandartAttributeNameToYAML[name as StandartAttributeName] ?? name,
  // extendDataForExportToXML: ({ data, rule }) => getExtendedStandardAttributeDescriptions(data as any, rule) as any,
  // omitIdAttributeInXML: true,
})

const getExtendedStandardAttributeDescriptions = (
  data: StandardAttributeDescription[],
  rule: PropertyRule | undefined
): StandardAttributeDescription[] => {
  const standartAttributeNames = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!standartAttributeNames) return data

  const dataMap = new Map<StandartAttributeName, StandardAttributeDescription>()
  for (const item of data) {
    dataMap.set(item.name as StandartAttributeName, item)
  }

  const result: StandardAttributeDescription[] = []
  for (const name of standartAttributeNames) {
    const existingItem = dataMap.get(name)
    result.push(existingItem ?? { name, itemType: StandardAttributeDescriptionRules.itemType })
  }
  return result
}
