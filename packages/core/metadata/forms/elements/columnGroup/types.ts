import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItems, ChildItemsEnterprise, ChildItemsXML } from "../../collections/childItems/types"

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
  childItems: ChildItems
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
  ChildItems?: ChildItemsXML
}

export interface ColumnGroupPartialEnterprise extends FormGroupPartialEnterprise {
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Группировка?: SE.ColumnsGroupEnterprise
  КартинкаШапки?: PictureEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображатьЗаголовок?: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПутьКДаннымШапки?: string
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ФорматШапки?: string
  ЦветФонаЗаголовка?: ColorEnterprise
  ПодчиненныеЭлементы?: ChildItemsEnterprise
}

export interface ColumnGroupTypedEnterprise extends ColumnGroupPartialEnterprise {
  Тип: "ГруппаКолонок"
}
