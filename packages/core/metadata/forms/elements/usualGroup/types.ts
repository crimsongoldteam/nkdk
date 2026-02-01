import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorPreview, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontPreview, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPreview } from "~/metadata/systemEnumerations/types"
import {
  GroupChildItems,
  GroupChildItemsPreview,
  GroupChildItemsXML,
  GroupChilItemPartialEnterprise,
} from "../../collections/childItems/types"
import { BaseElementXML } from "../baseElement/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface UsualGroup {
  elementType: "UsualGroup"
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

export interface UsualGroupXML extends BaseElementXML {
  AssociatedTableElementId: MetadataValueXML
  EnableContentChange?: boolean
  Enabled?: boolean
  Height?: number
  HorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  ReadOnly?: boolean
  Shortcut?: string
  Title?: I8nTextXML
  TitleFont?: FontXML
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  BackColor?: ColorXML
  Behavior?: SE.UsualGroupBehavior
  Collapsed: boolean
  CollapsedRepresentationTitle?: I8nTextXML
  ControlRepresentation?: SE.UsualGroupControlRepresentation
  CurrentRowUse?: SE.CurrentRowUse
  _DisplayImportance?: SE.DisplayImportance
  ExtendedTooltip: ExtendedTooltipXML
  Format?: I8nTextXML
  Group?: SE.ChildFormItemsGroup
  GroupHorizontalAlign?: SE.ItemHorizontalLocation
  GroupVerticalAlign?: SE.ItemVerticalAlign
  HiddenStateTitleBackColor?: ColorXML
  HorizontalSpacing?: SE.FormItemSpacing
  ChildrenAlign?: SE.ItemsAndTitlesAlignVariant
  Representation?: SE.UsualGroupRepresentation
  ShowLeftMargin?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  ThroughAlign?: SE.ThroughAlign
  TitleDataPath?: string
  United?: boolean
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalSpacing?: SE.FormItemSpacing
  ChildItems?: GroupChildItemsXML
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
  ElementType: "FormGroup"
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
