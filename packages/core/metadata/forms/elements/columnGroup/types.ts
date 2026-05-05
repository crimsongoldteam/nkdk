import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { PictureYAML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { TableChildItemsTypedYAML } from "../../commonObjects/childItems/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { ColumnGroupRules } from "./rules"

export type ColumnGroup = FormTypeByRule<typeof ColumnGroupRules>

export interface ColumnGroupPartialYAML {
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
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
  Группировка?: SE.ColumnsGroupYAML
  КартинкаШапки?: PictureYAML
  ОтображатьВШапке?: StringboolYAML
  ОтображатьЗаголовок?: StringboolYAML
  ПутьКДаннымШапки?: string
  ФиксацияВТаблице?: SE.FixingInTableYAML
  ФорматШапки?: string
  ЦветФонаЗаголовка?: ColorYAML
  Элементы?: TableChildItemsTypedYAML
}

export interface ColumnGroupTypedYAML extends ColumnGroupPartialYAML {
  Тип: "ГруппаКолонок"
}

export type ColumnGroupEnterprise = EnterpriseType<typeof ColumnGroupRules>
