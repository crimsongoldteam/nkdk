import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import { Table, TablePartialEnterprise, TableXML } from "~/metadata/forms/elements/table/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItems, ChildItemsPartialEnterprise, ChildItemsXML } from "../../collections/childItems/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface UsualGroup extends FormGroup {
  associatedTable?: Table
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
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  verticalSpacing?: SE.FormItemSpacing
  childItems: ChildItems
}

export interface UsualGroupXML extends FormGroupXML {
  AssociatedTable?: TableXML
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
  UserVisible?: UserVisibleXML
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalSpacing?: SE.FormItemSpacing
  ChildItems?: ChildItemsXML
}

export interface UsualGroupPartialEnterprise extends FormGroupPartialEnterprise {
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
  ЗапретитьИспользование?: UserVisibleEnterprise
  ИспользованиеТекущейСтроки?: SE.CurrentRowUseEnterprise
  ИспользуемаяТаблица?: TablePartialEnterprise
  Объединенная?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ОтображатьОтступСлева?: StringboolEnterprise
  Отображение?: SE.UsualGroupRepresentationEnterprise
  ОтображениеУправления?: SE.UsualGroupControlRepresentationEnterprise
  Поведение?: SE.UsualGroupBehaviorEnterprise
  ПутьКДаннымЗаголовка?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  СквозноеВыравнивание?: SE.ThroughAlignEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаЗаголовкаСкрытогоОтображения?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}

export interface UsualGroupTypedEnterprise extends UsualGroupPartialEnterprise {
  Тип: "Группа"
  ПодчиненныеЭлементы?: ChildItemsPartialEnterprise
}
