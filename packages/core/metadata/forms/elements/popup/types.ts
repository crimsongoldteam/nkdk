import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"

import { CommandBarGroupChildItem, CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { PopupRules } from "./rules"

export type PopupReference = ElementReferenceTypeByRule<typeof PopupRules>

export interface Popup {
  itemType: "Popup"
  name: string
  enableContentChange?: boolean
  enabled?: boolean
  displayImportance?: SE.DisplayImportance
  commandSource?: string
  height?: number
  // horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  readOnly?: boolean
  title?: I8nText
  titleFont?: Font
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  // type?: SE.FormGroupType
  userVisible?: UserVisible
  // verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  // extendedTooltip?: ExtendedTooltip
  backColor?: Color
  borderColor?: Color
  picture?: Picture
  representation?: SE.ButtonRepresentation
  shape?: SE.ButtonShape
  shapeRepresentation?: SE.ButtonShapeRepresentation
  childItems: CommandBarGroupChildItem[]
}

export interface PopupPartialYAML {
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormGroupTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ИсточникКоманд?: string
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  РазрешитьИзменениеСостава?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  // РасширеннаяПодсказка?: ExtendedTooltipYAML
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolYAML
  ЦветТекстаЗаголовка?: ColorYAML
  Ширина?: number
  ШрифтЗаголовка?: FontYAML
  Картинка?: PictureYAML
  Отображение?: SE.ButtonRepresentationYAML
  ОтображениеФигуры?: SE.ButtonShapeRepresentationYAML
  Фигура?: SE.ButtonShapeYAML
  ЦветРамки?: ColorYAML
  ЦветФона?: ColorYAML
  Элементы?: CommandBarGroupChildItemsTypedYAML
}

export interface PopupTypedYAML extends PopupPartialYAML {
  Тип: "Подменю"
}

export type PopupEnterprise = EnterpriseType<typeof PopupRules>
