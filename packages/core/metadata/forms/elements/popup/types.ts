import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"

import { ElementTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { PopupRules } from "./rules"

export type Popup = ElementTypeByRule<typeof PopupRules>

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
