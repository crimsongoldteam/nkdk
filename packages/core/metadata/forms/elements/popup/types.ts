import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"

import { CommandBarGroupChildItem, CommandBarGroupChildItemsTypedEnterprise } from "../../collections/childItems/types"

export interface Popup {
  elementType: "Popup"
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

export interface PopupPartialEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormGroupTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ИсточникКоманд?: string
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьИзменениеСостава?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  // РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  Ширина?: number
  ШрифтЗаголовка?: FontEnterprise
  Картинка?: PictureEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ПодчиненныеЭлементы?: CommandBarGroupChildItemsTypedEnterprise
}

export interface PopupTypedEnterprise extends PopupPartialEnterprise {
  Тип: "Подменю"
}
