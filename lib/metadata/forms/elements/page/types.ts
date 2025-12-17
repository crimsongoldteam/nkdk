import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface Page extends FormGroup {
  backColor?: Color
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  displayImportance?: SE.DisplayImportance
  format?: I8nText
  group?: SE.ChildFormItemsGroup
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  picture?: Picture
  scrollOnCompress?: boolean
  showTitle?: boolean
  slaveItemsWidth?: SE.ChildFormItemsWidth
  titleDataPath?: string
  verticalAlign?: SE.ItemVerticalAlign
  verticalScrollOnReduceSize?: boolean
  verticalSpacing?: SE.FormItemSpacing
  userVisible?: UserVisible
}

export interface PageXML extends FormGroupXML {
  BackColor?: ColorXML
  ChildItemsHorizontalAlign?: SE.ItemHorizontalLocation
  ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  _DisplayImportance?: SE.DisplayImportance
  Format?: I8nTextXML
  Group?: SE.ChildFormItemsGroup
  HorizontalSpacing?: SE.FormItemSpacing
  ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  Picture?: PictureXML
  ScrollOnCompress?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  TitleDataPath?: string
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalScrollOnReduceSize?: boolean
  VerticalSpacing?: SE.FormItemSpacing
  UserVisible?: UserVisibleXML
}

export interface PageEnterprise extends FormGroupEnterprise {
  ЦветФона?: ColorEnterprise
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Формат?: I8nTextEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  Картинка?: PictureEnterprise
  СкроллПриСжатии?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
  ПутьКДаннымЗаголовка?: string
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальнаяПрокруткаПриСжатии?: StringboolEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
}
