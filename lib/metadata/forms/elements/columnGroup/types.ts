import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  Группировка?: SE.ColumnsGroupEnterprise
  ПутьКДаннымШапки?: string
  ФорматШапки?: string
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  КартинкаШапки?: PictureEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  ЦветФонаЗаголовка?: ColorEnterprise
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
}
