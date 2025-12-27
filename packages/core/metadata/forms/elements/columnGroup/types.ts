import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface ColumnGroup extends FormGroup {
  fixingInTable?: SE.FixingInTable
  group?: SE.ColumnsGroup
  headerDataPath?: string
  headerFormat?: string
  headerHorizontalAlign?: SE.ItemHorizontalLocation
  headerPicture?: Picture
  showInHeader?: boolean
  showTitle?: boolean
  titleBackColor?: Color
  userVisible?: UserVisible
}

export interface ColumnGroupXML extends FormGroupXML {
  FixingInTable?: SE.FixingInTable
  Group?: SE.ColumnsGroup
  HeaderDataPath?: string
  HeaderFormat?: string
  HeaderHorizontalAlign?: SE.ItemHorizontalLocation
  HeaderPicture?: PictureXML
  ShowInHeader?: boolean
  ShowTitle?: boolean
  TitleBackColor?: ColorXML
  UserVisible?: UserVisibleXML
}

export interface ColumnGroupEnterprise extends FormGroupEnterprise {
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Группировка?: SE.ColumnsGroupEnterprise
  КартинкаШапки?: PictureEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  ПутьКДаннымШапки?: string
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ФорматШапки?: string
  ЦветФонаЗаголовка?: ColorEnterprise
}
