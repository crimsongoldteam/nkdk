import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { BorderYAML } from "~/metadata/commonObjects/border/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"

import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { ViewStatusAdditionRules } from "./rules"

export type ViewStatusAddition = ElementTypeByRule<typeof ViewStatusAdditionRules>

export interface ViewStatusAdditionYAML {
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
  Заголовок?: I8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
}

export type ViewStatusAdditionEnterprise = EnterpriseType<typeof ViewStatusAdditionRules>
