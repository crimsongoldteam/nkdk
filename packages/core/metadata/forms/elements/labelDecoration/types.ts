import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { BorderYAML } from "~/metadata/commonObjects/border/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = ElementTypeByRule<typeof LabelDecorationRules>

export interface LabelDecorationPartialYAML {
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormDecorationTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: FormattedI8nTextYAML
  ФорматированныйЗаголовок?: FormattedI8nTextYAML
  КонтекстноеМеню?: ContextMenuYAML
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПропускатьПриВводе?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ЦветТекста?: ColorYAML
  Ширина?: number
  Шрифт?: FontYAML
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВысотаЗаголовка?: number
  Гиперссылка?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  Рамка?: BorderYAML
  ЦветРамки?: ColorYAML
  ЦветФона?: ColorYAML
  События?: {
    Нажатие?: string
    ОбработкаНавигационнойСсылки?: string
  }
}

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
