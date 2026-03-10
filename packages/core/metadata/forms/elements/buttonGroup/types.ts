import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"

import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { CommandBarGroupChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { ButtonGroupRules } from "./rules"

export type ButtonGroup = FormTypeByRule<typeof ButtonGroupRules>

export interface ButtonGroupPartialYAML {
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  Отображение?: SE.ButtonGroupRepresentationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormGroupTypeYAML
  Видимость?: StringboolYAML
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  Подсказка?: I8nTextYAML
  РазрешитьИзменениеСостава?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  СочетаниеКлавиш?: string
  ТолькоПросмотр?: StringboolYAML
  ЦветТекстаЗаголовка?: ColorYAML
  Ширина?: number
  ШрифтЗаголовка?: FontYAML
  ИсточникКоманд?: string
  Элементы?: CommandBarGroupChildItemsTypedYAML
}

export interface ButtonGroupTypedYAML extends ButtonGroupPartialYAML {
  Тип: "ГруппаКнопок"
}

export type ButtonGroupEnterprise = EnterpriseType<typeof ButtonGroupRules>
