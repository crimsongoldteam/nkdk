import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { StringboolYAML, StringboolXML } from "~/metadata/commonObjects/boolean/types"
import { MetadataItemLink } from "~/metadata/commonObjects/metadataRef/types"
import { MetadataItem } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { HomePageWorkAreaRules } from "./rules"

export type HomePageWorkAreaTemplate = "OneColumn" | "TwoColumnsEqualWidth" | "TwoColumnsVariableWidth" | string

export type HomePageWorkAreaCommandInterfaceDisplay = "Top" | "Bottom" | "None" | string

export interface HomePageWorkAreaVisibility {
  common?: boolean
  roles?: Record<MetadataItemLink, boolean>
}

export interface HomePageWorkAreaColumnItem {
  form?: string
  height?: number
  visibility?: HomePageWorkAreaVisibility
}

export type HomePageWorkAreaColumnItems = HomePageWorkAreaColumnItem[]

export interface HomePageWorkAreaVisibilityXML {
  "xr:Common"?: StringboolXML
  "xr:Value"?: HomePageWorkAreaRoleVisibilityXML | HomePageWorkAreaRoleVisibilityXML[]
}

export interface HomePageWorkAreaRoleVisibilityXML {
  _name?: string
  name?: string
  "#text"?: StringboolXML
}

export interface HomePageWorkAreaColumnItemXML {
  Form?: string
  Height?: string | number
  Visibility?: HomePageWorkAreaVisibilityXML
}

export interface HomePageWorkAreaColumnXML {
  Item?: HomePageWorkAreaColumnItemXML | HomePageWorkAreaColumnItemXML[]
}

export interface HomePageWorkAreaVisibilityYAML {
  Общее?: StringboolYAML
  Роли?: Record<string, StringboolYAML>
}

export interface HomePageWorkAreaColumnItemYAML {
  Форма?: string
  Высота?: number
  Видимость?: HomePageWorkAreaVisibilityYAML
}

export type HomePageWorkAreaColumnItemsYAML = HomePageWorkAreaColumnItemYAML[]

export type HomePageWorkArea = MetadataTypeByRule<typeof HomePageWorkAreaRules> & MetadataItem
export type HomePageWorkAreaYAML = YAMLTypeByRule<typeof HomePageWorkAreaRules>

export interface HomePageWorkAreaColumnItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaColumnItems"
}

export type HomePageWorkAreaColumnItemsRuleParams = Omit<HomePageWorkAreaColumnItemsWidePropertyRule, "type">

export function homePageWorkAreaColumnItemsRule<const Params extends HomePageWorkAreaColumnItemsRuleParams>(
  params: WideExactRuleParams<HomePageWorkAreaColumnItemsRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaColumnItems" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaColumnItems", params)
}
export interface HomePageWorkAreaCommandInterfaceDisplayWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaCommandInterfaceDisplay"
}

export type HomePageWorkAreaCommandInterfaceDisplayRuleParams = Omit<
  HomePageWorkAreaCommandInterfaceDisplayWidePropertyRule,
  "type"
>

export function homePageWorkAreaCommandInterfaceDisplayRule<
  const Params extends HomePageWorkAreaCommandInterfaceDisplayRuleParams,
>(
  params: WideExactRuleParams<HomePageWorkAreaCommandInterfaceDisplayRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaCommandInterfaceDisplay" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaCommandInterfaceDisplay", params)
}
export interface HomePageWorkAreaTemplateWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaTemplate"
}

export type HomePageWorkAreaTemplateRuleParams = Omit<HomePageWorkAreaTemplateWidePropertyRule, "type">

export function homePageWorkAreaTemplateRule<const Params extends HomePageWorkAreaTemplateRuleParams>(
  params: WideExactRuleParams<HomePageWorkAreaTemplateRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaTemplate" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaTemplate", params)
}
