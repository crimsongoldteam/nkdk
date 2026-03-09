import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { PagesRules } from "./rules"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"

export type Pages = ElementTypeByRule<typeof PagesRules>

export interface PagesPartialYAML {
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormGroupTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РазрешитьИзменениеСостава?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolYAML
  ЦветТекстаЗаголовка?: ColorYAML
  Ширина?: number
  ШрифтЗаголовка?: FontYAML
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseYAML
  ИспользуемаяТаблица?: string
  ОтображениеСтраниц?: SE.FormPagesRepresentationYAML
  ТекущееСостояниеСтраниц?: SE.FormPagesStateYAML
  События?: {
    ПриСменеСтраницы?: string
  }
}

export interface PagesTypedYAML extends PagesPartialYAML {
  Тип: "Страницы"
}

export type PagesEnterprise = EnterpriseType<typeof PagesRules>
