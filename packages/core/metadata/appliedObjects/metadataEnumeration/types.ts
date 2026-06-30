import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { MetadataCommandsXML } from "~/metadata/appliedObjects/metadataCommand/types"
import { CharacteristicsDescriptionsXML } from "~/metadata/commonObjects/characteristicsDescription/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import { StandardAttributeDescriptionsXML } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataEnumerationRules, MetadataEnumerationValueRules } from "./rules"

export type MetadataEnumeration = MetadataTypeByRule<typeof MetadataEnumerationRules>
export type MetadataEnumerationYAML = YAMLTypeByRule<typeof MetadataEnumerationRules>

export type MetadataEnumerationValue = MetadataTypeByRule<typeof MetadataEnumerationValueRules>
export type MetadataEnumerationValueYAML = YAMLTypeByRule<typeof MetadataEnumerationValueRules>

export type MetadataEnumerationValues = MetadataEnumerationValue[]
export type MetadataEnumerationValuesYAML = Record<string, MetadataEnumerationValueYAML>

export type EnumerationInternalInfoParamsXML = [
  { name: string; category: "Ref" },
  { name: string; category: "Manager" },
  { name: string; category: "List" },
]

export interface MetadataEnumerationValueXML {
  _uuid: string
  Properties: {
    Comment?: string
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
  }
}

export type MetadataEnumerationValuesXML = MetadataEnumerationValueXML | MetadataEnumerationValueXML[]
export type ChildFormNamesXML = string[]
export type ChildTemplateNamesXML = string[]

export interface MetadataEnumerationXML {
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
  Enum: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<EnumerationInternalInfoParamsXML> | undefined
    Properties: {
      AuxiliaryChoiceForm?: string
      AuxiliaryListForm?: string
      Characteristics?: CharacteristicsDescriptionsXML
      ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
      ChoiceMode?: SE.ChoiceMode
      Comment?: string
      DefaultChoiceForm?: string
      DefaultListForm?: string
      Explanation?: I8nTextXML
      ExtendedListPresentation?: I8nTextXML
      ListPresentation?: I8nTextXML
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      QuickChoice?: boolean
      StandardAttributes?: StandardAttributeDescriptionsXML
      Synonym?: I8nTextXML
      UseStandardCommands?: boolean
    }
    ChildObjects?: {
      Command?: MetadataCommandsXML
      EnumValue?: MetadataEnumerationValuesXML
      Form?: ChildFormNamesXML
      Template?: ChildTemplateNamesXML
    }
  }
}

export interface MetadataEnumerationValuesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataEnumerationValues"
}

export type MetadataEnumerationValuesRuleParams = Omit<MetadataEnumerationValuesWidePropertyRule, "type">

export function metadataEnumerationValuesRule<const Params extends MetadataEnumerationValuesRuleParams>(
  params: WideExactRuleParams<MetadataEnumerationValuesRuleParams, Params>
): Readonly<{ type: "MetadataEnumerationValues" } & Params> {
  return defineWidePropertyRule("MetadataEnumerationValues", params)
}
