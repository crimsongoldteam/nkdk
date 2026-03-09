import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { PageRules } from "./rules"

export type Page = ElementTypeByRule<typeof PageRules>

export interface PagePartialYAML {
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
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальнаяПрокруткаПриСжатии?: StringboolYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignYAML
  ВертикальныйИнтервал?: SE.FormItemSpacingYAML
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantYAML
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationYAML
  ГоризонтальныйИнтервал?: SE.FormItemSpacingYAML
  Группировка?: SE.ChildFormItemsGroupYAML
  Картинка?: PictureYAML
  ОтображатьЗаголовок?: StringboolYAML
  ПутьКДаннымЗаголовка?: string
  СкроллПриСжатии?: StringboolYAML
  Формат?: I8nTextYAML
  ЦветФона?: ColorYAML
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthYAML
}

export type PageEnterprise = EnterpriseType<typeof PageRules>
