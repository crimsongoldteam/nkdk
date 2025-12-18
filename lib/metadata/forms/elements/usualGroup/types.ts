import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import { Table, TableEnterprise, TableXML } from "~/lib/metadata/forms/elements/table/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
}

export interface UsualGroupEnterprise extends FormGroupEnterprise {
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
  ИспользуемаяТаблица?: TableEnterprise
  Объединенная?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ОтображатьОтступСлева?: StringboolEnterprise
  Отображение?: SE.UsualGroupRepresentationEnterprise
  ОтображениеУправления?: SE.UsualGroupControlRepresentationEnterprise
  Поведение?: SE.UsualGroupBehaviorEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  ПутьКДаннымЗаголовка?: string
  СквозноеВыравнивание?: SE.ThroughAlignEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаЗаголовкаСкрытогоОтображения?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}
