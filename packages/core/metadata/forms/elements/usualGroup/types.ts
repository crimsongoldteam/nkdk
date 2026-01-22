import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { GroupChildItem, GroupChildItemXML, GroupChilItemPartialEnterprise } from "../../collections/childItems/types"
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
  type?: SE.FormGroupType
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
  collapsedRepresentationTitle?: string
  controlRepresentation?: SE.UsualGroupControlRepresentation
  currentRowUse?: SE.CurrentRowUse
  displayImportance?: SE.DisplayImportance
  extendedTooltip?: ExtendedTooltip
  format?: I8nText
  group?: SE.ChildFormItemsGroup
  groupHorizontalAlign?: SE.ItemHorizontalLocation
  groupVerticalAlign?: SE.ItemVerticalAlign
  hiddenRepresentationTitleBackColor?: Color
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  representation?: SE.UsualGroupRepresentation
  showLeftMargin?: boolean
  showTitle?: boolean
  slaveItemsWidth?: SE.ChildFormItemsWidth
  throughAlign?: SE.ThroughAlign
  titleDataPath?: string
  united?: boolean
  verticalAlign?: SE.ItemVerticalAlign
  verticalSpacing?: SE.FormItemSpacing
  childItems: GroupChildItem[]
}

export interface UsualGroupXML extends BaseElementXML {
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
  AssociatedAssociatedTableElementId?: MetadataValueXML
  BackColor?: ColorXML
  Behavior?: SE.UsualGroupBehavior
  ChildItemsHorizontalAlign?: SE.ItemHorizontalLocation
  ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  CollapsedRepresentationTitle?: string
  ControlRepresentation?: SE.UsualGroupControlRepresentation
  CurrentRowUse?: SE.CurrentRowUse
  _DisplayImportance?: SE.DisplayImportance
  ExtendedTooltip: ExtendedTooltipXML
  Format?: I8nTextXML
  Group?: SE.ChildFormItemsGroup
  GroupHorizontalAlign?: SE.ItemHorizontalLocation
  GroupVerticalAlign?: SE.ItemVerticalAlign
  HiddenRepresentationTitleBackColor?: ColorXML
  HorizontalSpacing?: SE.FormItemSpacing
  ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  Representation?: SE.UsualGroupRepresentation
  ShowLeftMargin?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  ThroughAlign?: SE.ThroughAlign
  TitleDataPath?: string
  United?: boolean
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalSpacing?: SE.FormItemSpacing
  ChildItems?: GroupChildItemXML | GroupChildItemXML[]
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
  ВертикальноеВыравниваниеГруппы?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  ГоризонтальноеВыравниваниеГруппы?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  ЗаголовокСвернутогоОтображения?: string
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  Объединенная?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ОтображатьОтступСлева?: StringboolEnterprise
  Отображение?: SE.UsualGroupRepresentationEnterprise
  ОтображениеУправления?: SE.UsualGroupControlRepresentationEnterprise
  Поведение?: SE.UsualGroupBehaviorEnterprise
  ПутьКДаннымЗаголовка?: string
  СквозноеВыравнивание?: SE.ThroughAlignEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаЗаголовкаСкрытогоОтображения?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}

export interface UsualGroupTypedEnterprise extends UsualGroupPartialEnterprise {
  Тип: "Группа"
  ПодчиненныеЭлементы?: GroupChilItemPartialEnterprise
}
