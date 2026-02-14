import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorPreview } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontPreview } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPreview } from "~/metadata/systemEnumerations/types"
import {
  GroupChildItems,
  GroupChildItemsPreview,
  GroupChilItemPartialEnterprise,
} from "../../collections/childItems/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../extendedTooltip/types"

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
  group?: SE.ChildFormItemsGroup
  hiddenRepresentationTitleBackColor?: Color
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  representation?: SE.UsualGroupRepresentation
  showLeftMargin?: boolean
  showTitle?: boolean
  // slaveItemsWidth?: SE.ChildFormItemsWidth // depricated in 8.3.7
  throughAlign?: SE.ThroughAlign
  titleDataPath?: string
  united?: boolean
  verticalSpacing?: SE.FormItemSpacing
  childItems: GroupChildItems
}

export interface UsualGroupPartialEnterprise {
  Таблица?: string
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
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  ЗаголовокСвернутогоОтображения?: I8nTextEnterprise
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  Объединенная?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ОтображатьОтступСлева?: StringboolEnterprise
  Отображение?: SE.UsualGroupRepresentationEnterprise
  ОтображениеУправления?: SE.UsualGroupControlRepresentationEnterprise
  Поведение?: SE.UsualGroupBehaviorEnterprise
  ПутьКДаннымЗаголовка?: string
  СквозноеВыравнивание?: SE.ThroughAlignEnterprise
  Свернута?: StringboolEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаЗаголовкаСкрытогоОтображения?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}

export interface UsualGroupTypedEnterprise extends UsualGroupPartialEnterprise {
  Тип: "Группа"
  ПодчиненныеЭлементы?: GroupChilItemPartialEnterprise
}

export interface UsualGroupPreview {
  itemType: "FormGroup"
  Name: string
  BackColor?: ColorPreview
  Behavior?: SystemEnumerationPreview
  Collapsed?: boolean
  CollapsedRepresentationTitle?: string
  ControlRepresentation?: SystemEnumerationPreview
  CurrentRowUse?: SystemEnumerationPreview
  DisplayImportance?: SystemEnumerationPreview
  EnableContentChange?: boolean
  Enabled?: boolean
  Format?: string
  Group?: SystemEnumerationPreview
  Height?: number
  HiddenRepresentationTitleBackColor?: ColorPreview
  HorizontalAlign?: SystemEnumerationPreview
  HorizontalSpacing?: SystemEnumerationPreview
  HorizontalStretch?: boolean
  ItemsAndTitlesAlign?: SystemEnumerationPreview
  ReadOnly?: boolean
  Representation?: SystemEnumerationPreview
  ShowLeftMargin?: boolean
  ShowTitle?: boolean
  ThroughAlign?: SystemEnumerationPreview
  Title?: string
  TitleDataPath?: string
  TitleFont?: FontPreview
  TitleTextColor?: ColorPreview
  ToolTip?: string
  ToolTipRepresentation?: SystemEnumerationPreview
  United?: boolean
  VerticalAlign?: SystemEnumerationPreview
  VerticalSpacing?: SystemEnumerationPreview
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  ChildItems: GroupChildItemsPreview
}
