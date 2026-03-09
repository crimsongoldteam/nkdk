import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ElementReferenceTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  GroupChildItems,
  // GroupChildItemsEnterprise,
  GroupChildItemsPartialYAML,
} from "../../commonObjects/childItems/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { UsualGroupRules } from "./rules"

export type UsualGroupReference = ElementReferenceTypeByRule<typeof UsualGroupRules>

export interface UsualGroup {
  itemType: "UsualGroup"
  name: string
  enableContentChange?: boolean
  enabled?: boolean
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  readOnly?: boolean
  shortcut?: string
  title?: I8nText
  titleFont?: Font
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  table?: string
  backColor?: Color
  behavior?: SE.UsualGroupBehavior
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  collapsedRepresentationTitle?: I8nText
  collapsed?: boolean
  controlRepresentation?: SE.UsualGroupControlRepresentation
  currentRowUse?: SE.CurrentRowUse
  displayImportance?: SE.DisplayImportance
  extendedTooltip?: ExtendedTooltip
  format?: I8nText
  group: SE.ChildFormItemsGroup
  hiddenRepresentationTitleBackColor?: Color
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  representation?: SE.UsualGroupRepresentation
  showLeftMargin?: boolean
  showTitle: boolean
  // slaveItemsWidth?: SE.ChildFormItemsWidth // depricated in 8.3.7
  throughAlign?: SE.ThroughAlign
  titleDataPath?: string
  united?: boolean
  verticalSpacing?: SE.FormItemSpacing
  childItems: GroupChildItems
}

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
