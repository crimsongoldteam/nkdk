import { StringboolYAML } from "../../../commonObjects/boolean/types"
import { ColorYAML } from "../../../commonObjects/color/types"
import { FontYAML } from "../../../commonObjects/font/types"
import { I8nTextYAML } from "../../../commonObjects/i8nText/types"
import { UserVisibleYAML } from "../../../commonObjects/userVisible/types"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import * as SE from "../../../systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SearchStringAdditionRules, SingleSearchStringAdditionRules } from "./rules"

export type SearchStringAddition = FormTypeByRule<typeof SearchStringAdditionRules>

export type SingleSearchStringAddition = FormTypeByRule<typeof SingleSearchStringAdditionRules>

export interface SearchStringAdditionYAML {
  Источник?: string
  РастягиватьПоГоризонтали?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  МаксимальнаяШирина?: number
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветФона?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Видимость?: StringboolYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  Использование?: UserVisibleYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
}

export interface SingleSearchStringAdditionYAML extends Omit<SearchStringAdditionYAML, "Источник"> {}

export type SearchStringAdditionEnterprise = EnterpriseType<typeof SearchStringAdditionRules>

export type SingleSearchStringAdditionEnterprise = EnterpriseType<typeof SingleSearchStringAdditionRules>
