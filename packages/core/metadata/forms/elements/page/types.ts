import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"

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
  userVisible?: UserVisible
  verticalAlign?: SE.ItemVerticalAlign
  verticalScrollOnReduceSize?: boolean
  verticalSpacing?: SE.FormItemSpacing
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
  UserVisible?: UserVisibleXML
  VerticalAlign?: SE.ItemVerticalAlign
  VerticalScrollOnReduceSize?: boolean
  VerticalSpacing?: SE.FormItemSpacing
}

export interface PageEnterprise extends FormGroupEnterprise {
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальнаяПрокруткаПриСжатии?: StringboolEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  Картинка?: PictureEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПутьКДаннымЗаголовка?: string
  СкроллПриСжатии?: StringboolEnterprise
  Формат?: I8nTextEnterprise
  ЦветФона?: ColorEnterprise
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
}
