import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SearchStringAdditionRules, SingleSearchStringAdditionRules } from "./rules"

export type SearchStringAddition = ElementTypeByRule<typeof SearchStringAdditionRules>

export type SingleSearchStringAddition = ElementTypeByRule<typeof SingleSearchStringAdditionRules>

export interface SearchStringAdditionYAML {
  Источник?: string
  РастягиватьПоГоризонтали?: StringboolYAML
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
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
}

export interface SingleSearchStringAdditionYAML extends Omit<SearchStringAdditionYAML, "Источник"> {}

export type SearchStringAdditionEnterprise = EnterpriseType<typeof SearchStringAdditionRules>

export type SingleSearchStringAdditionEnterprise = EnterpriseType<typeof SingleSearchStringAdditionRules>
