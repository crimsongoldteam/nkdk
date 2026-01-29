import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { BaseElementPropsEnterprise, BaseElementXML, NamedElement } from "~/metadata/forms/elements/baseElement/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface Button extends NamedElement {
  elementType: "Button"
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  backColor?: Color
  borderColor?: Color
  commandName?: string
  commandUniqueness?: boolean
  dataPath?: string
  defaultButton?: boolean
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  font?: Font
  height?: number
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  horizontalStretch?: boolean
  locationInCommandBar?: SE.ButtonLocationInCommandBar
  maxHeight?: number
  maxWidth?: number
  onlyInAllActions?: boolean
  picture?: Picture
  pictureLocation?: SE.FormButtonPictureLocation
  representation?: SE.ButtonRepresentation
  shape?: SE.ButtonShape
  shapeRepresentation?: SE.ButtonShapeRepresentation
  shortcut?: string
  skipOnInput?: boolean
  textColor?: Color
  title?: I8nText
  titleHeight?: number
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormButtonType
  userVisible?: UserVisible
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
}

export interface ButtonXML extends BaseElementXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BackColor?: ColorXML
  BorderColor?: ColorXML
  CommandName?: string
  CommandUniqueness?: boolean
  DataPath?: string
  DefaultButton?: boolean
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  Font?: FontXML
  Height?: number
  GroupHorizontalAlign?: SE.ItemHorizontalLocation
  HorizontalStretch?: boolean
  LocationInCommandBar?: SE.ButtonLocationInCommandBar
  MaxHeight?: number
  MaxWidth?: number
  OnlyInAllActions?: boolean
  Picture?: PictureXML
  PictureLocation?: SE.FormButtonPictureLocation
  Representation?: SE.ButtonRepresentation
  Shape?: SE.ButtonShape
  ShapeRepresentation?: SE.ButtonShapeRepresentation
  Shortcut?: string
  SkipOnInput?: boolean
  TextColor?: ColorXML
  Title?: I8nTextXML
  TitleHeight?: number
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormButtonType
  UserVisible?: UserVisibleXML
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
}

export interface ButtonPartialEnterprise extends BaseElementPropsEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormButtonTypeEnterprise
  Видимость?: StringboolEnterprise
  Высота?: number
  ВысотаЗаголовка?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ИмяКоманды?: string
  Картинка?: PictureEnterprise
  КнопкаПоУмолчанию?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Отображение?: SE.ButtonRepresentationEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  ПоложениеВКоманднойПанели?: SE.ButtonLocationInCommandBarEnterprise
  ПоложениеКартинки?: SE.FormButtonPictureLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  СочетаниеКлавиш?: string
  ТолькоВоВсехДействиях?: StringboolEnterprise
  УникальностьКоманды?: StringboolEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  Ширина?: number
  Шрифт?: FontEnterprise
}

export interface ButtonTypedEnterprise extends ButtonPartialEnterprise {
  Тип: "Кнопка"
}
