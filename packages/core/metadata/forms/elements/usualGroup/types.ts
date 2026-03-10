import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ColorYAML } from "~/metadata/commonObjects/color/types"
import { FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  // GroupChildItemsEnterprise,
  GroupChildItemsPartialYAML,
} from "../../commonObjects/childItems/types"
import { ExtendedTooltipYAML } from "../extendedTooltip/types"
import { UsualGroupRules } from "./rules"

export type UsualGroup = FormTypeByRule<typeof UsualGroupRules>

export interface UsualGroupPartialYAML {
  Таблица?: string
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
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
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignYAML
  ВертикальныйИнтервал?: SE.FormItemSpacingYAML
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantYAML
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationYAML
  ГоризонтальныйИнтервал?: SE.FormItemSpacingYAML
  Группировка?: SE.ChildFormItemsGroupYAML
  ЗаголовокСвернутогоОтображения?: I8nTextYAML
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseYAML
  Объединенная?: StringboolYAML
  ОтображатьЗаголовок?: StringboolYAML
  ОтображатьОтступСлева?: StringboolYAML
  Отображение?: SE.UsualGroupRepresentationYAML
  ОтображениеУправления?: SE.UsualGroupControlRepresentationYAML
  Поведение?: SE.UsualGroupBehaviorYAML
  ПутьКДаннымЗаголовка?: string
  СквозноеВыравнивание?: SE.ThroughAlignYAML
  Свернута?: StringboolYAML
  Формат?: I8nTextYAML
  ЦветФона?: ColorYAML
  ЦветФонаЗаголовкаСкрытогоОтображения?: ColorYAML
  // ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthYAML
}

export interface UsualGroupTypedYAML extends UsualGroupPartialYAML {
  Тип: "Группа"
  Элементы?: GroupChildItemsPartialYAML
}

export type UsualGroupEnterprise = EnterpriseType<typeof UsualGroupRules>
