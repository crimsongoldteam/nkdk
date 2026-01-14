import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItems, ChildItemsXML } from "../../collections/childItems/types"
import { BaseElementXML } from "../baseElement/types"
import { ExtendedTooltipEnterprise } from "../extendedTooltip/types"

export interface Page extends Omit<FormGroup, "elementType"> {
  elementType: "Page"
  backColor?: Color
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  displayImportance?: SE.DisplayImportance
  format?: I8nText
  group?: SE.ChildFormItemsGroup
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  picture?: Picture
  scrollOnCompress?: boolean
  showTitle?: boolean
  slaveItemsWidth?: SE.ChildFormItemsWidth
  titleDataPath?: string
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  verticalScrollOnReduceSize?: boolean
  verticalSpacing?: SE.FormItemSpacing
  childItems: ChildItems
}

export interface PageXML extends BaseElementXML {
  EnableContentChange?: boolean
  Enabled?: boolean
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  ReadOnly?: boolean
  Shortcut?: string
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormGroupType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  BackColor?: ColorXML
  ChildItemsHorizontalAlign?: SE.ItemHorizontalLocation
  ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  _DisplayImportance?: SE.DisplayImportance
  Format?: I8nTextXML
  Group?: SE.ChildFormItemsGroup
  HorizontalSpacing?: SE.FormItemSpacing
  ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  Picture?: PictureXML
  ScrollOnCompress?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  TitleDataPath?: string
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalScrollOnReduceSize?: boolean
  VerticalSpacing?: SE.FormItemSpacing
  ChildItems?: ChildItemsXML
}

export interface PagePartialEnterprise {
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьИзменениеСостава?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШрифтЗаголовка?: FontEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальнаяПрокруткаПриСжатии?: StringboolEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  Картинка?: PictureEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ПутьКДаннымЗаголовка?: string
  СкроллПриСжатии?: StringboolEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}

export interface PageTypedEnterprise extends PagePartialEnterprise {
  Тип: "Страница"
}

// Для обратной совместимости
export type PageEnterprise = PagePartialEnterprise
