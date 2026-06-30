import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { BorderYAML } from "~/metadata/commonObjects/border/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"

import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SingleViewStatusAdditionRules, ViewStatusAdditionRules } from "./rules"

export type ViewStatusAddition = FormTypeByRule<typeof ViewStatusAdditionRules>

export type SingleViewStatusAddition = FormTypeByRule<typeof SingleViewStatusAdditionRules>

export interface ViewStatusAdditionYAML {
  Источник?: string
  АвтоМаксимальнаяШирина?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  МаксимальнаяШирина?: number
  Рамка?: BorderYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветФона?: ColorYAML
  ЦветФонаКнопок?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ШрифтЗаголовка?: FontYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  Доступность?: StringboolYAML
  Видимость?: StringboolYAML
  Заголовок?: I8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
}

export interface SingleViewStatusAdditionYAML extends Omit<ViewStatusAdditionYAML, "Источник"> {}

export type ViewStatusAdditionEnterprise = EnterpriseType<typeof ViewStatusAdditionRules>

export type SingleViewStatusAdditionEnterprise = EnterpriseType<typeof SingleViewStatusAdditionRules>

export interface ContextMenuWidePropertyRule extends WidePropertyRuleBase {
  type: "ContextMenu"
}

export type ContextMenuRuleParams = Omit<ContextMenuWidePropertyRule, "type">

export function contextMenuRule<const Params extends ContextMenuRuleParams>(
  params: WideExactRuleParams<ContextMenuRuleParams, Params>
): Readonly<{ type: "ContextMenu" } & Params> {
  return defineWidePropertyRule("ContextMenu", params)
}
export interface ExtendedTooltipWidePropertyRule extends WidePropertyRuleBase {
  type: "ExtendedTooltip"
}

export type ExtendedTooltipRuleParams = Omit<ExtendedTooltipWidePropertyRule, "type">

export function extendedTooltipRule<const Params extends ExtendedTooltipRuleParams>(
  params: WideExactRuleParams<ExtendedTooltipRuleParams, Params>
): Readonly<{ type: "ExtendedTooltip" } & Params> {
  return defineWidePropertyRule("ExtendedTooltip", params)
}
