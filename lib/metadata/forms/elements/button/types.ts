import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/lib/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { BaseElement, BaseElementEnterprise, BaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"
import {
  FormDecoration,
  FormDecorationEnterprise,
  FormDecorationXML,
} from "~/lib/metadata/forms/elements/formDecoration/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface Button extends BaseElement {
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
  extendedTooltip?: FormDecoration
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
  verticalAlignInGroup?: SE.ItemVerticalAlign
  verticalStretch?: boolean
  visible?: boolean
  width?: number
  userVisible?: UserVisible
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
  ExtendedTooltip?: FormDecorationXML
  Font?: FontXML
  Height?: number
  HorizontalAlignInGroup?: SE.ItemHorizontalLocation
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
  VerticalAlignInGroup?: SE.ItemVerticalAlign
  VerticalStretch?: boolean
  Visible?: boolean
  Width?: number
  UserVisible?: UserVisibleXML
}

export interface ButtonEnterprise extends BaseElementEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЦветФона?: ColorEnterprise
  ЦветРамки?: ColorEnterprise
  ИмяКоманды?: string
  УникальностьКоманды?: StringboolEnterprise
  ПутьКДанным?: string
  КнопкаПоУмолчанию?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  Доступность?: StringboolEnterprise
  РасширеннаяПодсказка?: FormDecorationEnterprise
  Шрифт?: FontEnterprise
  Высота?: number
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  ПоложениеВКоманднойПанели?: SE.ButtonLocationInCommandBarEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ТолькоВоВсехДействиях?: StringboolEnterprise
  Картинка?: PictureEnterprise
  ПоложениеКартинки?: SE.FormButtonPictureLocationEnterprise
  Отображение?: SE.ButtonRepresentationEnterprise
  Фигура?: SE.ButtonShapeEnterprise
  ОтображениеФигуры?: SE.ButtonShapeRepresentationEnterprise
  СочетаниеКлавиш?: string
  ПропускатьПриВводе?: StringboolEnterprise
  ЦветТекста?: ColorEnterprise
  Заголовок?: I8nTextEnterprise
  ВысотаЗаголовка?: number
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  Вид?: SE.FormButtonTypeEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  Видимость?: StringboolEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
}
