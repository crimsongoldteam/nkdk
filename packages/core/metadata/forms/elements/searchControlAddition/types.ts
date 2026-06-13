import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"

import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormElementTreeYAML } from "../../commonObjects/childItems/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { SearchControlAdditionRules, SingleSearchControlAdditionRules } from "./rules"

export type SearchControlAddition = FormTypeByRule<typeof SearchControlAdditionRules>

export type SingleSearchControlAddition = FormTypeByRule<typeof SingleSearchControlAdditionRules>

export interface SearchControlAdditionYAML {
  АвтоМаксимальнаяШирина?: StringboolYAML
  МаксимальнаяШирина?: number
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
  Использование?: UserVisibleYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  Элементы?: FormElementTreeYAML
}

export interface SingleSearchControlAdditionYAML extends SearchControlAdditionYAML {}

export type SearchControlAdditionEnterprise = EnterpriseType<typeof SearchControlAdditionRules>

export type SingleSearchControlAdditionEnterprise = EnterpriseType<typeof SingleSearchControlAdditionRules>
