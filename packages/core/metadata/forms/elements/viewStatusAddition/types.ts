import { StringboolYAML } from "../../../commonObjects/boolean/types"
import { BorderYAML } from "../../../commonObjects/border/types"
import { ColorYAML } from "../../../commonObjects/color/types"
import { FontYAML } from "../../../commonObjects/font/types"
import { I8nTextYAML } from "../../../commonObjects/i8nText/types"

import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import * as SE from "../../../systemEnumerations/types"
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
